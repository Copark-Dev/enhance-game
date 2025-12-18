# 🎮 강화 시뮬레이터 설정 가이드

## 1. Firebase 프로젝트 설정

### 1.1 프로젝트 생성
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 후 생성

### 1.2 웹 앱 등록
1. 프로젝트 설정 → 일반 → "앱 추가" → 웹(</>)
2. 앱 닉네임 입력 후 등록
3. firebaseConfig 값 복사해두기

### 1.3 Firestore 설정
1. 왼쪽 메뉴 → Firestore Database → "데이터베이스 만들기"
2. "프로덕션 모드"로 시작
3. 위치 선택 (asia-northeast3 추천)

### 1.4 Authentication 설정
1. 왼쪽 메뉴 → Authentication → 시작하기
2. Sign-in method 탭 → "새 공급업체 추가" 는 건너뛰기 (Custom Token 사용)

### 1.5 요금제 업그레이드 (Cloud Functions용)
1. 왼쪽 하단 → "업그레이드" 클릭
2. Blaze 요금제 선택 (종량제, 무료 할당량 있음)
3. 결제 정보 등록

---

## 2. 카카오 개발자 설정

### 2.1 애플리케이션 등록
1. [카카오 개발자](https://developers.kakao.com/) 접속
2. 내 애플리케이션 → 애플리케이션 추가
3. 앱 이름 입력 후 저장

### 2.2 플랫폼 설정
1. 앱 설정 → 플랫폼 → Web 플랫폼 등록
2. 사이트 도메인 추가:
   - 개발용: http://localhost:5173
   - 배포용: https://your-project.web.app

### 2.3 카카오 로그인 설정
1. 제품 설정 → 카카오 로그인 → 활성화 ON
2. Redirect URI 등록: http://localhost:5173
3. 동의항목 → 닉네임, 프로필 사진 "필수 동의"로 설정

### 2.4 앱 키 확인
1. 앱 설정 → 앱 키 → **JavaScript 키** 복사

---

## 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```
# Firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123

# Kakao
VITE_KAKAO_JS_KEY=your-kakao-javascript-key
```

---

## 4. Cloud Functions 배포

```bash
# Firebase CLI 로그인
firebase login

# 프로젝트 연결
firebase use your-project-id

# Functions 의존성 설치
cd functions
npm install
cd ..

# Firestore 규칙 + Functions 배포
firebase deploy
```

---

## 5. Firestore 보안 규칙

Firebase Console → Firestore → 규칙 탭에서 아래 내용 붙여넣기:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /levelImages/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/admins/$(request.auth.uid)).data.isAdmin == true;
    }
    match /admins/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }
    match /rankings/{rankId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
  }
}
```

---

## 6. 어드민 권한 설정

Firebase Console → Firestore에서 수동으로 어드민 등록:

1. 컬렉션 `admins` 생성
2. 문서 ID: `kakao:카카오유저ID` (예: kakao:12345678)
3. 필드 추가: `isAdmin: true`

---

## 7. 실행

```bash
# 개발 서버
npm run dev

# 빌드
npm run build

# Firebase 호스팅 배포
firebase deploy --only hosting
```

---

## 🔒 보안 체크리스트

- [ ] Firestore 규칙이 제대로 적용되었는지 확인
- [ ] .env 파일이 .gitignore에 포함되어 있는지 확인
- [ ] 카카오 플랫폼에 프로덕션 도메인 등록
- [ ] Firebase 콘솔에서 승인된 도메인 확인
