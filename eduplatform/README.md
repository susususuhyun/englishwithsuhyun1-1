# EduPlatform

Firebase(Auth + Firestore) 기반 영어 학습 관리 웹앱. Vite + React + TypeScript + Tailwind.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## GitHub Pages 배포

1. Firebase 콘솔에서 프로젝트 생성 → Authentication에서 "익명" 로그인 활성화 → Firestore Database 생성.
2. 이 저장소를 GitHub에 push.
3. 저장소 Settings → Secrets and variables → Actions 에서 아래 Secret 등록:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_APP_ID` (예: eng-edu-app)
   - `VITE_ADMIN_PASSWORD`
4. 저장소 Settings → Pages → Source를 "GitHub Actions"로 설정.
5. `main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 자동으로 빌드 후 배포합니다.
6. Firebase 콘솔 → Authentication → Settings → Authorized domains 에 `<username>.github.io` 추가.

## 보안 관련 필수 확인 사항

- 관리자 비밀번호는 빌드 시 번들에 포함되므로(클라이언트 코드 특성상) 브라우저 개발자도구로 노출될 수 있습니다. 실제 서비스라면 Firebase Auth의 커스텀 클레임/서버 검증 방식으로 전환을 권장합니다.
- Firestore 보안 규칙을 반드시 설정하세요. 기본 테스트 모드로 두면 누구나 학생 PIN과 성적 데이터를 읽고 쓸 수 있습니다.
