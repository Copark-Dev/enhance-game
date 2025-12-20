import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Firebase Messaging 초기화
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
