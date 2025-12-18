// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase 설정 (빌드 시 환경변수로 대체 필요)
firebase.initializeApp({
  apiKey: "AIzaSyCVBwDM5yKX9GYdFkDM5X8D-JLKZMZXyXc",
  authDomain: "enhance-game-simulator.firebaseapp.com",
  projectId: "enhance-game-simulator",
  storageBucket: "enhance-game-simulator.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지:', payload);

  const notificationTitle = payload.notification?.title || '강화 시뮬레이터';
  const notificationOptions = {
    body: payload.notification?.body || '새로운 알림이 있습니다',
    icon: '/images/items/10.png',
    badge: '/images/items/1.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '확인하기' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of windowClients) {
          if (client.url.includes('enhance-game') && 'focus' in client) {
            return client.focus();
          }
        }
        // 없으면 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
