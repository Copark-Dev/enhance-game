import { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 카카오 SDK 초기화
    const kakaoKey = import.meta.env.VITE_KAKAO_JS_KEY;
    if (window.Kakao && !window.Kakao.isInitialized() && kakaoKey) {
      window.Kakao.init(kakaoKey);
      console.log('Kakao SDK 초기화 완료');
    }

    // URL에서 access_token 확인 (카카오 로그인 후 리다이렉트)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const tokenPart = hash.split('access_token=')[1];
      if (tokenPart) {
        const accessToken = tokenPart.split('&')[0];
        if (accessToken) {
          window.Kakao.Auth.setAccessToken(accessToken);
          fetchKakaoUser();
          window.history.replaceState(null, '', window.location.pathname);
          return;
        }
      }
    }

    // 저장된 사용자 복원
    const savedUser = localStorage.getItem('kakaoUser');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setUser(parsed);
        syncUserData(parsed.id);
      } catch (e) {
        localStorage.removeItem('kakaoUser');
      }
    }
    setLoading(false);
  }, []);

  const fetchKakaoUser = async () => {
    try {
      window.Kakao.API.request({
        url: '/v2/user/me',
        success: async (res) => {
          const kakaoUser = {
            id: res.id.toString(),
            nickname: res.properties?.nickname || '사용자',
            profileImage: res.properties?.profile_image || null,
          };
          await saveUserToFirestore(kakaoUser);
        },
        fail: (err) => {
          console.error('사용자 정보 가져오기 실패:', err);
          setLoading(false);
        },
      });
    } catch (err) {
      console.error('카카오 API 오류:', err);
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.log('동기화 스킵');
    }
  };

  const loginWithKakao = () => {
    if (!window.Kakao) {
      alert('카카오 SDK 로드 실패');
      return;
    }
    
    // 현재 페이지 URL을 redirect URI로 사용
    const redirectUri = window.location.origin + window.location.pathname;
    
    window.Kakao.Auth.authorize({
      redirectUri: redirectUri,
      scope: 'profile_nickname,profile_image',
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

  return (
    <AuthContext.Provider value={{ user, loading, loginWithKakao, logout, updateUserData }}>
      {children}
    </AuthContext.Provider>
  );
};
