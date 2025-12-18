import { createContext, useContext, useState, useEffect } from 'react';
import { db, requestFCMToken, onForegroundMessage } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 함수들을 useEffect 전에 선언
  const saveUserToFirestore = async (kakaoUser) => {
    const userRef = doc(db, 'users', kakaoUser.id);

    try {
      const userSnap = await getDoc(userRef);
      let userData;

      if (userSnap.exists()) {
        await updateDoc(userRef, {
          nickname: kakaoUser.nickname,
          profileImage: kakaoUser.profileImage,
          lastLogin: new Date().toISOString(),
        });
        userData = { ...kakaoUser, ...userSnap.data() };
      } else {
        userData = {
          ...kakaoUser,
          gold: 50000,
          stats: { attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 },
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
        };
        // email도 저장
        if (kakaoUser.email) {
          userData.email = kakaoUser.email;
        }
        await setDoc(userRef, userData);
      }

      setUser(userData);
      localStorage.setItem('kakaoUser', JSON.stringify(userData));
    } catch (dbErr) {
      console.error('Firestore 오류:', dbErr);
      const localData = {
        ...kakaoUser,
        gold: 50000,
        stats: { attempts: 0, successes: 0, failures: 0, maxLevel: 0, totalSpent: 0, totalEarned: 0 },
      };
      setUser(localData);
      localStorage.setItem('kakaoUser', JSON.stringify(localData));
    }
    setLoading(false);
  };

  const fetchKakaoUser = async () => {
    try {
      const res = await window.Kakao.API.request({
        url: '/v2/user/me',
      });
      const kakaoUser = {
        id: res.id.toString(),
        nickname: res.properties?.nickname || '사용자',
        profileImage: res.properties?.profile_image || null,
        email: res.kakao_account?.email || null,
      };
      await saveUserToFirestore(kakaoUser);
    } catch (err) {
      console.error('카카오 API 오류:', err);
      setLoading(false);
    }
  };

  const syncUserData = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const firebaseData = userSnap.data();
        const localData = JSON.parse(localStorage.getItem('kakaoUser'));
        const merged = { ...localData, ...firebaseData };
        setUser(merged);
        localStorage.setItem('kakaoUser', JSON.stringify(merged));
      }
    } catch (_err) {
      console.log('동기화 스킵');
    }
  };

  useEffect(() => {
    // 카카오 SDK 초기화
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (window.Kakao && !window.Kakao.isInitialized() && kakaoKey) {
      window.Kakao.init(kakaoKey);
      console.log('Kakao SDK 초기화 완료');
    }

    // URL에서 code 확인 (카카오 로그인 후 리다이렉트)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      // code로 access token 받기
      fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: import.meta.env.VITE_KAKAO_JS_KEY,
          redirect_uri: window.location.origin + window.location.pathname,
          code: code,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.access_token) {
            window.Kakao.Auth.setAccessToken(data.access_token);
            fetchKakaoUser();
            window.history.replaceState(null, '', window.location.pathname);
          }
        })
        .catch((err) => {
          console.error('토큰 교환 실패:', err);
          setLoading(false);
        });
      return;
    }

    // 저장된 사용자 복원
    const savedUser = localStorage.getItem('kakaoUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        syncUserData(parsed.id);
      } catch (_e) {
        localStorage.removeItem('kakaoUser');
      }
    }
    setLoading(false);
  }, []);

  const loginWithKakao = () => {
    if (!window.Kakao) {
      alert('카카오 SDK 로드 실패');
      return;
    }
    
    // 현재 페이지 URL을 redirect URI로 사용
    const redirectUri = window.location.origin + window.location.pathname;
    
    window.Kakao.Auth.authorize({
      redirectUri: redirectUri,
      scope: 'profile_nickname,profile_image,account_email',
    });
  };

  const logout = () => {
    if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout();
    }
    setUser(null);
    localStorage.removeItem('kakaoUser');
  };

  const updateUserData = async (data) => {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    localStorage.setItem('kakaoUser', JSON.stringify(updatedUser));

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, data);
    } catch (err) {
      console.log('Firestore 업데이트 실패');
    }
  };

  // 닉네임으로 사용자 검색
  const searchUserByNickname = async (nickname) => {
    if (!nickname.trim()) return [];
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('nickname', '==', nickname.trim()));
      const querySnapshot = await getDocs(q);
      const results = [];
      querySnapshot.forEach((doc) => {
        if (doc.id !== user?.id) { // 자기 자신 제외
          results.push({ id: doc.id, ...doc.data() });
        }
      });
      return results;
    } catch (err) {
      console.error('검색 실패:', err);
      return [];
    }
  };

  // 친구 추가
  const addFriend = async (friendId) => {
    if (!user || friendId === user.id) return false;
    const currentFriends = user.friends || [];
    if (currentFriends.includes(friendId)) return false;

    const newFriends = [...currentFriends, friendId];
    await updateUserData({ friends: newFriends });
    return true;
  };

  // 친구 삭제
  const removeFriend = async (friendId) => {
    if (!user) return false;
    const currentFriends = user.friends || [];
    const newFriends = currentFriends.filter(id => id !== friendId);
    await updateUserData({ friends: newFriends });
    return true;
  };

  // 친구 목록 가져오기 (상세 정보 포함)
  const getFriendsList = async () => {
    if (!user || !user.friends || user.friends.length === 0) return [];
    const friendsData = [];
    for (const friendId of user.friends) {
      try {
        const friendRef = doc(db, 'users', friendId);
        const friendSnap = await getDoc(friendRef);
        if (friendSnap.exists()) {
          friendsData.push({ id: friendId, ...friendSnap.data() });
        }
      } catch (err) {
        console.error('친구 정보 로드 실패:', friendId);
      }
    }
    return friendsData;
  };

  // 골드 선물하기
  const sendGold = async (friendId, amount) => {
    if (!user || amount <= 0 || amount > user.gold) return { success: false, message: '골드가 부족합니다' };

    try {
      // 내 골드 차감
      const newGold = user.gold - amount;
      await updateUserData({ gold: newGold });

      // 상대방 골드 증가
      const friendRef = doc(db, 'users', friendId);
      const friendSnap = await getDoc(friendRef);
      if (friendSnap.exists()) {
        const friendData = friendSnap.data();
        const friendNewGold = (friendData.gold || 0) + amount;
        await updateDoc(friendRef, { gold: friendNewGold });
        return { success: true, message: `${amount}G를 선물했습니다!` };
      }
      return { success: false, message: '친구를 찾을 수 없습니다' };
    } catch (err) {
      console.error('선물 실패:', err);
      return { success: false, message: '선물 실패' };
    }
  };

  // 랭킹 가져오기
  const getRankings = async () => {
    try {
      const usersRef = collection(db, 'users');
      const rankings = {
        maxLevel: [],
        totalEarned: [],
        successes: [],
        battleWins: []
      };

      // 모든 사용자 가져오기 (최대 100명)
      const querySnapshot = await getDocs(query(usersRef, limit(100)));
      const users = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          nickname: data.nickname,
          avatar: data.profileImage,
          maxLevel: data.stats?.maxLevel || 0,
          totalEarned: data.stats?.totalEarned || 0,
          successes: data.stats?.successes || 0,
          battleWins: data.battleStats?.wins || 0
        });
      });

      // 각 카테고리별 정렬
      rankings.maxLevel = [...users]
        .sort((a, b) => b.maxLevel - a.maxLevel)
        .slice(0, 20)
        .map(u => ({ ...u, value: u.maxLevel }));

      rankings.totalEarned = [...users]
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, 20)
        .map(u => ({ ...u, value: u.totalEarned }));

      rankings.successes = [...users]
        .sort((a, b) => b.successes - a.successes)
        .slice(0, 20)
        .map(u => ({ ...u, value: u.successes }));

      rankings.battleWins = [...users]
        .sort((a, b) => b.battleWins - a.battleWins)
        .slice(0, 20)
        .map(u => ({ ...u, value: u.battleWins }));

      return rankings;
    } catch (err) {
      console.error('랭킹 로드 실패:', err);
      return { maxLevel: [], totalEarned: [], successes: [], battleWins: [] };
    }
  };

  // 일일 보상 수령
  const claimDailyReward = async (reward, newStreak) => {
    if (!user) return false;
    try {
      const newGold = (user.gold || 0) + reward;
      await updateUserData({
        gold: newGold,
        lastDailyReward: new Date().toISOString(),
        dailyStreak: newStreak
      });
      return true;
    } catch (err) {
      console.error('일일 보상 수령 실패:', err);
      return false;
    }
  };

  // 업적 보상 수령
  const claimAchievement = async (achievementId, reward) => {
    if (!user) return false;
    try {
      const claimedAchievements = user.claimedAchievements || [];
      if (claimedAchievements.includes(achievementId)) return false;

      const newGold = (user.gold || 0) + reward;
      await updateUserData({
        gold: newGold,
        claimedAchievements: [...claimedAchievements, achievementId]
      });
      return true;
    } catch (err) {
      console.error('업적 보상 수령 실패:', err);
      return false;
    }
  };

  // 배틀 결과 업데이트
  const updateBattleStats = async (won, reward) => {
    if (!user) return false;
    try {
      const battleStats = user.battleStats || { battles: 0, wins: 0 };
      const newBattleStats = {
        battles: battleStats.battles + 1,
        wins: battleStats.wins + (won ? 1 : 0)
      };
      const newGold = won ? (user.gold || 0) + reward : user.gold;
      await updateUserData({
        gold: newGold,
        battleStats: newBattleStats
      });
      return true;
    } catch (err) {
      console.error('배틀 결과 업데이트 실패:', err);
      return false;
    }
  };

  // 랜덤 매칭용 상대 목록 가져오기
  const getRandomOpponents = async (count = 5) => {
    if (!user) return [];
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef, limit(50)));
      const users = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.id) {
          const data = docSnap.data();
          // 배틀 가능한 아이템이 있는 유저만 (maxLevel > 0)
          if (data.stats?.maxLevel > 0) {
            users.push({
              id: docSnap.id,
              nickname: data.nickname || '익명',
              profileImage: data.profileImage,
              stats: data.stats,
              // 배틀용 아이템 정보 (최고 레벨 기반으로 추정)
              battleItem: {
                level: data.stats?.maxLevel || 0,
                attack: (data.stats?.maxLevel || 0) * 50,
                hp: (data.stats?.maxLevel || 0) * 100
              }
            });
          }
        }
      });
      // 랜덤 셔플 후 count개만 반환
      const shuffled = users.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (err) {
      console.error('랜덤 상대 로드 실패:', err);
      return [];
    }
  };

  // 배틀 결과 저장 (상대방에게 알림)
  const saveBattleNotification = async (opponentId, battleResult) => {
    if (!user) return false;
    try {
      const notificationRef = doc(collection(db, 'battleNotifications'));
      await setDoc(notificationRef, {
        recipientId: opponentId,
        attackerId: user.id,
        attackerName: user.nickname,
        attackerImage: user.profileImage,
        attackerWon: battleResult.won, // 공격자 기준 승패
        attackerLevel: battleResult.myLevel,
        attackerAttack: battleResult.myAttack || 0,
        attackerHp: battleResult.myHp || 0,
        defenderLevel: battleResult.opponentLevel,
        reward: battleResult.reward,
        rounds: battleResult.rounds,
        timestamp: new Date().toISOString(),
        read: false
      });
      return true;
    } catch (err) {
      console.error('배틀 알림 저장 실패:', err);
      return false;
    }
  };

  // 배틀 알림 가져오기
  const getBattleNotifications = async () => {
    if (!user) return [];
    try {
      const notificationsRef = collection(db, 'battleNotifications');
      const q = query(
        notificationsRef,
        where('recipientId', '==', user.id),
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      const notifications = [];
      querySnapshot.forEach((docSnap) => {
        notifications.push({ id: docSnap.id, ...docSnap.data() });
      });
      return notifications;
    } catch (err) {
      console.error('배틀 알림 로드 실패:', err);
      return [];
    }
  };

  // 배틀 알림 읽음 처리
  const markBattleNotificationsRead = async (notificationIds) => {
    try {
      for (const notifId of notificationIds) {
        const notifRef = doc(db, 'battleNotifications', notifId);
        await updateDoc(notifRef, { read: true });
      }
      return true;
    } catch (err) {
      console.error('배틀 알림 읽음 처리 실패:', err);
      return false;
    }
  };

  // FCM 토큰 저장
  const saveFCMToken = async () => {
    if (!user) return null;
    try {
      const token = await requestFCMToken();
      if (token) {
        await updateUserData({ fcmToken: token });
        console.log('FCM 토큰 저장 완료');
        return token;
      }
    } catch (err) {
      console.error('FCM 토큰 저장 실패:', err);
    }
    return null;
  };

  // 포그라운드 알림 설정
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      console.log('포그라운드 메시지:', payload);
      // 브라우저 알림 표시
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || '강화 시뮬레이터', {
          body: payload.notification?.body,
          icon: '/images/items/10.png'
        });
      }
    });
    return unsubscribe;
  }, []);

  // 10강 이상 달성 시 친구들에게 알림 전송
  const notifyFriendsHighEnhance = async (newLevel) => {
    if (!user || newLevel < 10) return;
    if (!user.friends || user.friends.length === 0) return;

    try {
      // 친구들의 FCM 토큰 가져오기
      const friendTokens = [];
      for (const friendId of user.friends) {
        const friendRef = doc(db, 'users', friendId);
        const friendSnap = await getDoc(friendRef);
        if (friendSnap.exists()) {
          const friendData = friendSnap.data();
          if (friendData.fcmToken) {
            friendTokens.push(friendData.fcmToken);
          }
        }
      }

      if (friendTokens.length === 0) return;

      // 알림 데이터 저장 (Firebase Functions에서 처리)
      const notifRef = doc(collection(db, 'enhanceNotifications'));
      await setDoc(notifRef, {
        senderId: user.id,
        senderName: user.nickname,
        senderImage: user.profileImage,
        level: newLevel,
        tokens: friendTokens,
        timestamp: new Date().toISOString(),
        processed: false
      });

      console.log(`${friendTokens.length}명의 친구에게 알림 전송 예약`);
    } catch (err) {
      console.error('친구 알림 전송 실패:', err);
    }
  };

  // 강화 로그 저장 (실시간 피드용)
  const saveEnhanceLog = async (level, result, previousLevel) => {
    if (!user) return;
    try {
      const logRef = doc(collection(db, 'enhanceLogs'));
      await setDoc(logRef, {
        userId: user.id,
        nickname: user.nickname,
        profileImage: user.profileImage,
        level: level,
        previousLevel: previousLevel,
        result: result, // 'success' | 'fail' | 'destroyed'
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('강화 로그 저장 실패:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, loginWithKakao, logout, updateUserData,
      searchUserByNickname, addFriend, removeFriend, getFriendsList, sendGold,
      getRankings, claimDailyReward, claimAchievement, updateBattleStats,
      getRandomOpponents, saveBattleNotification, getBattleNotifications, markBattleNotificationsRead,
      saveFCMToken, notifyFriendsHighEnhance, saveEnhanceLog
    }}>
      {children}
    </AuthContext.Provider>
  );
};
