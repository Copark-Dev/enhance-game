import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getAuth, signInWithCustomToken, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const functions = getFunctions(app, 'asia-northeast3');

// 개발 환경에서 에뮬레이터 사용 (필요시 주석 해제)
// if (window.location.hostname === 'localhost') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

// ============================================
// Cloud Functions 호출 함수들
// ============================================

// 카카오 토큰 검증 및 Firebase 로그인
export const verifyKakaoToken = httpsCallable(functions, 'verifyKakaoToken');

// 보안 강화
export const secureEnhance = httpsCallable(functions, 'secureEnhance');

// 보안 판매
export const secureSell = httpsCallable(functions, 'secureSell');

// 보안 골드 선물
export const secureSendGold = httpsCallable(functions, 'secureSendGold');

// 보안 일일 보상
export const secureClaimDailyReward = httpsCallable(functions, 'secureClaimDailyReward');

// 보안 광고 보상
export const secureAdReward = httpsCallable(functions, 'secureAdReward');

// ============================================
// Firebase Auth 함수들
// ============================================

// Firebase Custom Token으로 로그인
export const signInWithFirebase = async (customToken) => {
  try {
    const userCredential = await signInWithCustomToken(auth, customToken);
    return userCredential.user;
  } catch (error) {
    console.error('Firebase 로그인 실패:', error);
    throw error;
  }
};

// Firebase 로그아웃
export const signOutFirebase = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase 로그아웃 실패:', error);
    throw error;
  }
};

// Firebase 인증 상태 구독
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// 현재 사용자 가져오기
export const getCurrentUser = () => {
  return auth.currentUser;
};

// ============================================
// Firebase Messaging (FCM)
// ============================================

let messaging = null;
try {
  messaging = getMessaging(app);
} catch (err) {
  // FCM not supported in this browser
}

// FCM 토큰 요청
export const requestFCMToken = async () => {
  if (!messaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return null;
    }

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
    });
    return token;
  } catch (err) {
    console.error('FCM 토큰 요청 실패:', err);
    return null;
  }
};

// 포그라운드 메시지 수신
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

export { messaging };
export default app;
