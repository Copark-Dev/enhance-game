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

// 10강 이상 달성 알림 전송
exports.sendEnhanceNotification = functions.firestore
  .document('enhanceNotifications/{notifId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    if (data.processed) return;

    const { senderName, level, tokens } = data;

    if (!tokens || tokens.length === 0) {
      console.log('전송할 토큰이 없습니다');
      return;
    }

    // 푸시 알림 메시지 구성
    const message = {
      notification: {
        title: '친구의 강화 소식!',
        body: `${senderName}님이 +${level}강에 성공했습니다!`
      },
      data: {
        type: 'enhance_success',
        level: level.toString(),
        senderName: senderName
      },
      tokens: tokens
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(message);
      console.log(`알림 전송 완료: 성공 ${response.successCount}, 실패 ${response.failureCount}`);

      // 처리 완료 표시
      await snap.ref.update({ processed: true, result: {
        successCount: response.successCount,
        failureCount: response.failureCount
      }});
    } catch (err) {
      console.error('푸시 알림 전송 실패:', err);
      await snap.ref.update({ processed: true, error: err.message });
    }
  });

// 배틀 알림 푸시 전송
exports.sendBattleNotification = functions.firestore
  .document('battleNotifications/{notifId}')
  .onCreate(async (snap, context) => {
    const data = snap.data();

    // 상대방의 FCM 토큰 가져오기
    const recipientRef = admin.firestore().collection('users').doc(data.recipientId);
    const recipientSnap = await recipientRef.get();

    if (!recipientSnap.exists) return;

    const recipientData = recipientSnap.data();
    const fcmToken = recipientData.fcmToken;

    if (!fcmToken) {
      console.log('상대방의 FCM 토큰이 없습니다');
      return;
    }

    const won = !data.attackerWon; // 수신자 기준 승패
    const message = {
      notification: {
        title: won ? '배틀 승리!' : '배틀 도전!',
        body: won
          ? `${data.attackerName}님의 도전을 물리쳤습니다!`
          : `${data.attackerName}님에게 패배했습니다...`
      },
      data: {
        type: 'battle',
        attackerId: data.attackerId,
        won: won.toString()
      },
      token: fcmToken
    };

    try {
      await admin.messaging().send(message);
      console.log('배틀 알림 푸시 전송 완료');
    } catch (err) {
      console.error('배틀 푸시 전송 실패:', err);
    }
  });

// 오래된 강화 로그 정리 (1시간마다 실행)
exports.cleanupEnhanceLogs = functions.pubsub
  .schedule('every 60 minutes')
  .onRun(async (context) => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    try {
      const logsRef = admin.firestore().collection('enhanceLogs');
      const oldLogs = await logsRef
        .where('timestamp', '<', oneHourAgo)
        .get();

      const batch = admin.firestore().batch();
      let count = 0;

      oldLogs.forEach((doc) => {
        batch.delete(doc.ref);
        count++;
      });

      if (count > 0) {
        await batch.commit();
        console.log(`${count}개의 오래된 강화 로그 삭제 완료`);
      }
    } catch (err) {
      console.error('로그 정리 실패:', err);
    }
  });
