# 🎮 강화 시뮬레이터 - 프로젝트 핸드오프

## 프로젝트 위치
```
~/Desktop/projects/enhance-game/
```

## 기술 스택
- React 19 + Vite
- Framer Motion (애니메이션)
- Firebase Firestore (데이터베이스)
- 카카오 로그인 (OAuth)

## 현재 상태
- ✅ 강화 게임 로직 완성 (0~20강, 성공/실패/파괴/하락)
- ✅ 골드 시스템 (강화비용, 판매, 손익계산)
- ✅ 레벨별 애니메이션 (1초~5초, 이펙트 차등)
- ✅ 카카오 로그인 연동
- ✅ Firebase Firestore 연동
- ✅ 어드민 페이지 (레벨별 이미지 관리)
- ✅ GitHub Actions 배포 설정

## 남은 작업

### 1. GitHub Secrets 등록 (필수)
레포 → Settings → Secrets and variables → Actions → New repository secret

| Name | Value |
|------|-------|
| VITE_FIREBASE_API_KEY | AIzaSyDn6YtHO3EZXXCoXR8mUcue3g9_2gHhaos |
| VITE_FIREBASE_AUTH_DOMAIN | enhanced-game.firebaseapp.com |
| VITE_FIREBASE_PROJECT_ID | enhanced-game |
| VITE_FIREBASE_STORAGE_BUCKET | enhanced-game.firebasestorage.app |
| VITE_FIREBASE_MESSAGING_SENDER_ID | 728397646248 |
| VITE_FIREBASE_APP_ID | 1:728397646248:web:042a9223a49ab6aaa6f59d |
| VITE_KAKAO_JS_KEY | 98342a830899133c07b9f13ff0f0f2bf |

### 2. GitHub Pages 설정
Settings → Pages → Source: GitHub Actions

### 3. 카카오 개발자 Redirect URI 추가
```
https://copark-dev.github.io/enhance-game/
```

### 4. Firebase Console Firestore 규칙
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if true;
    }
    match /levelImages/{imageId} {
      allow read, write: if true;
    }
  }
}
```

## 주요 파일 구조
```
src/
├── App.jsx                 # 라우팅 (HashRouter)
├── components/
│   ├── EnhanceGame.jsx     # 메인 게임 화면
│   ├── ItemDisplay.jsx     # 아이템 + 강화 애니메이션
│   ├── ParticleEffect.jsx  # 파티클 이펙트
│   ├── AdminPage.jsx       # 레벨별 이미지 관리
│   ├── LoginPage.jsx       # 카카오 로그인
│   └── ...
├── context/
│   ├── AuthContext.jsx     # 카카오 로그인 + Firestore 연동
│   └── ImageContext.jsx    # 레벨별 이미지 관리
├── hooks/
│   └── useEnhance.js       # 강화 로직
└── utils/
    ├── constants.js        # 확률/비용/판매가 테이블
    └── firebase.js         # Firebase 설정
```

## 강화 확률 테이블 (constants.js)
| 레벨 | 성공률 | 하락확률 | 파괴확률 |
|------|--------|----------|----------|
| 0-2강 | 95-85% | 0-15% | 0% |
| 3-5강 | 80-70% | 20-30% | 0.5-1.5% |
| 6-9강 | 65-50% | 40-70% | 2-5% |
| 10-14강 | 45-25% | 80-100% | 7-22% |
| 15-17강 | 20-10% | 100% | 28-42% |
| 18-20강 | 7-3% | 100% | 50-70% |

## 애니메이션 시간
- 0-5강: 1초
- 6-9강: 1.5초
- 10-14강: 2초
- 15-18강: 3초
- 19-20강: 5초

## 로컬 실행
```bash
cd ~/Desktop/projects/enhance-game
npm install
npm run dev
```

## 배포 URL (설정 완료 후)
```
https://copark-dev.github.io/enhance-game/
```

## GitHub 레포
```
https://github.com/Copark-Dev/enhance-game
```
