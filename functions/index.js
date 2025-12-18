const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');

admin.initializeApp();

// 카카오 토큰으로 Firebase Custom Token 발급
exports.createFirebaseToken = functions.https.onCall(async (data, context) => {
  const { kakaoAccessToken } = data;
  
  if (!kakaoAccessToken) {
    throw new functions.https.HttpsError('invalid-argument', '카카오 액세스 토큰이 필요합니다.');
  }

  try {
    // 카카오 API로 사용자 정보 검증
    const kakaoResponse = await axios.get('https://kapi.kakao.com/v2/user/me', {
      headers: {
        'Authorization': 'Bearer ' + kakaoAccessToken,
        'Content-Type': 'application/json'
      }
    });

    const kakaoUser = kakaoResponse.data;
    const uid = 'kakao:' + kakaoUser.id;
    const nickname = kakaoUser.properties?.nickname || '사용자';
    const profileImage = kakaoUser.properties?.profile_image || null;

    // Firebase Custom Token 생성
    const firebaseToken = await admin.auth().createCustomToken(uid, {
      provider: 'kakao',
      kakaoId: kakaoUser.id.toString(),
      nickname: nickname,
      profileImage: profileImage
    });

    // Firestore에 사용자 정보 저장/업데이트
    const userRef = admin.firestore().collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // 신규 사용자
      await userRef.set({
        kakaoId: kakaoUser.id.toString(),
        nickname: nickname,
        profileImage: profileImage,
        gold: 50000,
        stats: {
          attempts: 0,
          successes: 0,
          failures: 0,
          maxLevel: 0,
          totalSpent: 0,
          totalEarned: 0
        },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // 기존 사용자 - 로그인 시간 업데이트
      await userRef.update({
        nickname: nickname,
        profileImage: profileImage,
        lastLogin: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    return { firebaseToken };
  } catch (error) {
    console.error('카카오 인증 오류:', error);
    throw new functions.https.HttpsError('unauthenticated', '카카오 인증에 실패했습니다.');
  }
});

// 랭킹 업데이트 (사용자가 직접 호출 불가)
exports.updateRanking = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const userId = context.params.userId;
    
    if (newData.stats?.maxLevel > 0) {
      await admin.firestore().collection('rankings').doc(userId).set({
        nickname: newData.nickname,
        profileImage: newData.profileImage,
        maxLevel: newData.stats.maxLevel,
        totalEarned: newData.stats.totalEarned,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }
  });
