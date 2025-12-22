import { createContext, useContext, useState, useEffect } from 'react';
import { db, requestFCMToken, onForegroundMessage, verifyKakaoToken, signInWithFirebase, signOutFirebase, onAuthChange, secureSendGold as secureSendGoldFn, secureClaimAchievement as secureClaimAchievementFn, secureBattleReward as secureBattleRewardFn } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// 오프라인 골드 계산 (시간당 2,000G, 최대 12시간 = 24,000G)
const calculateOfflineGold = (lastLogin) => {
  if (!lastLogin) return 0;
  const lastTime = new Date(lastLogin).getTime();
  const now = Date.now();
  const diffHours = (now - lastTime) / (1000 * 60 * 60);

  if (diffHours < 1) return 0;

  const hours = Math.min(diffHours, 12);
  return Math.floor(hours * 2000);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offlineReward, setOfflineReward] = useState(null);
  const [unsubscribeUser, setUnsubscribeUser] = useState(null);

  // 실시간 유저 데이터 구독
  const startUserListener = (userId) => {
    if (unsubscribeUser) {
      unsubscribeUser();
    }

    const userRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const firebaseData = docSnap.data();
        setUser(prev => {
          const merged = { ...prev, ...firebaseData, id: userId };
          localStorage.setItem('kakaoUser', JSON.stringify(merged));
          return merged;
        });
      }
    }, (error) => {
      console.error('실시간 리스너 오류:', error);
    });

    setUnsubscribeUser(() => unsubscribe);
  };

  // Firebase Auth로 사용자 데이터 동기화
  const syncUserDataFromFirebase = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const firebaseData = userSnap.data();

        // 오프라인 골드 계산
        const offlineGold = calculateOfflineGold(firebaseData.lastLogin?.toDate?.() || firebaseData.lastLogin);
        if (offlineGold > 0) {
          const hoursAway = Math.min(
            Math.floor((Date.now() - new Date(firebaseData.lastLogin?.toDate?.() || firebaseData.lastLogin).getTime()) / (1000 * 60 * 60)),
            12
          );
          setOfflineReward({ gold: offlineGold, hours: hoursAway });

          const newGold = (firebaseData.gold || 0) + offlineGold;
          await updateDoc(userRef, {
            gold: newGold,
            lastLogin: new Date().toISOString()
          });
          firebaseData.gold = newGold;
        } else {
          await updateDoc(userRef, {
            lastLogin: new Date().toISOString()
          });
        }

        setUser({ ...firebaseData, id: userId });
        localStorage.setItem('kakaoUser', JSON.stringify({ ...firebaseData, id: userId }));
        startUserListener(userId);
      }
    } catch (err) {
      console.error('데이터 동기화 실패:', err);
    }
  };

  // 카카오 로그인 후 Firebase 인증
  const handleKakaoLoginComplete = async (accessToken) => {
    try {
      // Cloud Function으로 카카오 토큰 검증 및 Firebase 토큰 발급
      const result = await verifyKakaoToken({ accessToken });
      const { customToken, user: kakaoUserInfo } = result.data;

      // Firebase Custom Token으로 로그인
      await signInWithFirebase(customToken);

      // 사용자 데이터 동기화
      await syncUserDataFromFirebase(kakaoUserInfo.id);

      return true;
    } catch (error) {
      console.error('카카오-Firebase 인증 실패:', error);
      throw error;
    }
  };

  useEffect(() => {
    // 카카오 SDK 초기화
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (window.Kakao && !window.Kakao.isInitialized() && kakaoKey) {
      window.Kakao.init(kakaoKey);
    }

    // Firebase Auth 상태 구독
    const unsubscribeAuth = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Firebase 인증됨 - 사용자 데이터 로드
        await syncUserDataFromFirebase(firebaseUser.uid);
      } else {
        // 인증 안됨
        setUser(null);
      }
      setLoading(false);
    });

    // URL에서 카카오 code 확인 (OAuth 리다이렉트)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {
      // 카카오 OAuth code로 access token 교환
      fetch('https://kauth.kakao.com/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: import.meta.env.VITE_KAKAO_JS_KEY,
          redirect_uri: window.location.origin.replace('http://', 'https://') + window.location.pathname,
          code: code,
        }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.access_token) {
            window.Kakao.Auth.setAccessToken(data.access_token);
            await handleKakaoLoginComplete(data.access_token);
            window.history.replaceState(null, '', window.location.pathname);
          }
        })
        .catch((err) => {
          console.error('토큰 교환 실패:', err);
          setLoading(false);
        });
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) {
        unsubscribeUser();
      }
    };
  }, []);

  const loginWithKakao = () => {
    if (!window.Kakao) {
      alert('카카오 SDK 로드 실패');
      return;
    }

    const origin = window.location.origin.replace('http://', 'https://');
    const redirectUri = origin + window.location.pathname;

    window.Kakao.Auth.authorize({
      redirectUri: redirectUri,
      scope: 'profile_nickname,profile_image,account_email',
    });
  };

  const logout = async () => {
    if (unsubscribeUser) {
      unsubscribeUser();
      setUnsubscribeUser(null);
    }

    if (window.Kakao && window.Kakao.Auth.getAccessToken()) {
      window.Kakao.Auth.logout();
    }

    try {
      await signOutFirebase();
    } catch (err) {
      console.error('Firebase 로그아웃 실패:', err);
    }

    setUser(null);
    localStorage.removeItem('kakaoUser');
  };

  const updateUserData = async (data) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, data);
    } catch (err) {
      console.error('Firestore 업데이트 실패:', err);
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      localStorage.setItem('kakaoUser', JSON.stringify(updatedUser));
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
        if (doc.id !== user?.id) {
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

  // 친구 목록 가져오기
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

  // 골드 선물하기 (보안 Cloud Function 사용)
  const sendGold = async (friendId, amount) => {
    if (!user || amount <= 0 || amount > user.gold) {
      return { success: false, message: '골드가 부족합니다' };
    }

    try {
      const result = await secureSendGoldFn({ recipientId: friendId, amount });
      return { success: true, message: `${amount}G를 선물했습니다!` };
    } catch (err) {
      console.error('선물 실패:', err);
      return { success: false, message: err.message || '선물 실패' };
    }
  };

  // 선물 알림 가져오기
  const getGiftNotifications = async () => {
    if (!user) return [];
    try {
      const q = query(
        collection(db, 'giftNotifications'),
        where('recipientId', '==', user.id),
        where('read', '==', false),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
      console.error('선물 알림 로드 실패:', err);
      return [];
    }
  };

  // 선물 알림 읽음 처리
  const markGiftNotificationsRead = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, 'giftNotifications'),
        where('recipientId', '==', user.id),
        where('read', '==', false)
      );
      const snapshot = await getDocs(q);
      for (const docSnap of snapshot.docs) {
        await updateDoc(doc(db, 'giftNotifications', docSnap.id), { read: true });
      }
    } catch (err) {
      console.error('알림 읽음 처리 실패:', err);
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

  // 일일 보상 수령 (서버에서 처리하므로 여기서는 UI 업데이트만)
  const claimDailyReward = async (reward, newStreak) => {
    // 실제 보상은 secureClaimDailyReward Cloud Function에서 처리
    // 여기서는 호환성을 위해 유지
    return true;
  };

  // 업적 보상 수령 (보안: Cloud Function 사용)
  const claimAchievement = async (achievementId, reward) => {
    if (!user) return false;
    try {
      const result = await secureClaimAchievementFn({ achievementId });
      // 성공 시 서버에서 골드와 업적 목록이 업데이트됨
      // onSnapshot 리스너가 자동으로 UI 업데이트
      return true;
    } catch (err) {
      console.error('업적 보상 수령 실패:', err);
      return false;
    }
  };

  // 배틀 결과 업데이트 (보안: Cloud Function 사용)
  const updateBattleStats = async (won, opponentId, opponentTotalLevel, myTotalLevel) => {
    if (!user) return { success: false, reward: 0 };
    try {
      const result = await secureBattleRewardFn({
        opponentId,
        won,
        opponentTotalLevel,
        myTotalLevel
      });
      // 성공 시 서버에서 골드와 배틀 스탯이 업데이트됨
      // onSnapshot 리스너가 자동으로 UI 업데이트
      return { success: true, reward: result.data.reward };
    } catch (err) {
      console.error('배틀 결과 업데이트 실패:', err);
      // 쿨다운 에러 처리
      if (err.code === 'functions/resource-exhausted') {
        return { success: false, error: '배틀 쿨다운 중입니다.', reward: 0 };
      }
      return { success: false, reward: 0 };
    }
  };

  // 랜덤 매칭용 상대 목록
  const getRandomOpponents = async (count = 5) => {
    if (!user) return [];
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(query(usersRef, limit(50)));
      const users = [];
      querySnapshot.forEach((docSnap) => {
        if (docSnap.id !== user.id) {
          const data = docSnap.data();
          const hasCurrentItem = data.level > 0 && !data.isDestroyed;
          const hasInventory = data.inventory && data.inventory.length > 0;

          if (hasCurrentItem || hasInventory) {
            const team = [];

            if (hasCurrentItem) {
              team.push({
                id: 'current',
                level: data.level,
                attack: data.itemStats?.attack || data.level * 50,
                hp: data.itemStats?.hp || data.level * 80,
                speed: data.itemStats?.speed || 0
              });
            }

            if (data.inventory) {
              data.inventory.forEach((item, idx) => {
                const itemLevel = item?.level || item || 0;
                if (itemLevel > 0) {
                  team.push({
                    id: `inv-${idx}`,
                    level: itemLevel,
                    attack: item?.attack || itemLevel * 50,
                    hp: item?.hp || itemLevel * 80,
                    speed: item?.speed || 0
                  });
                }
              });
            }

            if (team.length > 0) {
              users.push({
                id: docSnap.id,
                nickname: data.nickname || '익명',
                profileImage: data.profileImage,
                stats: data.stats,
                team: team.sort((a, b) => b.level - a.level)
              });
            }
          }
        }
      });
      const shuffled = users.sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    } catch (err) {
      console.error('랜덤 상대 로드 실패:', err);
      return [];
    }
  };

  // 배틀 결과 저장
  const saveBattleNotification = async (opponentId, battleResult) => {
    if (!user) return false;
    try {
      const notificationRef = doc(collection(db, 'battleNotifications'));
      await setDoc(notificationRef, {
        recipientId: opponentId,
        attackerId: user.id,
        attackerName: user.nickname,
        attackerImage: user.profileImage,
        attackerWon: battleResult.won,
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
      if (Notification.permission === 'granted') {
        new Notification(payload.notification?.title || '강화 시뮬레이터', {
          body: payload.notification?.body,
          icon: '/images/items/10.png'
        });
      }
    });
    return unsubscribe;
  }, []);

  // 10강 이상 달성 시 친구들에게 알림
  const notifyFriendsHighEnhance = async (newLevel) => {
    if (!user || newLevel < 10) return;
    if (!user.friends || user.friends.length === 0) return;

    try {
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
    } catch (err) {
      console.error('친구 알림 전송 실패:', err);
    }
  };

  // 오프라인 보상 확인 완료
  const dismissOfflineReward = () => {
    setOfflineReward(null);
  };

  // 강화 로그 저장
  const saveEnhanceLog = async (level, result, previousLevel) => {
    if (!user) return;
    const targetLevel = result === 'success' ? level : previousLevel;
    if (targetLevel < 10) return;

    try {
      const logRef = doc(collection(db, 'enhanceLogs'));
      await setDoc(logRef, {
        userId: user.id,
        nickname: user.nickname,
        profileImage: user.profileImage,
        level: level,
        previousLevel: previousLevel,
        result: result,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('강화 로그 저장 실패:', err);
    }
  };

  // 채팅 메시지 저장
  const saveChatMessage = async (message) => {
    if (!user || !message.trim()) return;

    try {
      const chatRef = doc(collection(db, 'enhanceLogs'));
      await setDoc(chatRef, {
        type: 'chat',
        userId: user.id,
        nickname: user.nickname,
        profileImage: user.profileImage,
        message: message.trim().slice(0, 100),
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('채팅 저장 실패:', err);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, loginWithKakao, logout, updateUserData,
      searchUserByNickname, addFriend, removeFriend, getFriendsList, sendGold,
      getGiftNotifications, markGiftNotificationsRead,
      getRankings, claimDailyReward, claimAchievement, updateBattleStats,
      getRandomOpponents, saveBattleNotification, getBattleNotifications, markBattleNotificationsRead,
      saveFCMToken, notifyFriendsHighEnhance, saveEnhanceLog, saveChatMessage,
      offlineReward, dismissOfflineReward
    }}>
      {children}
    </AuthContext.Provider>
  );
};
