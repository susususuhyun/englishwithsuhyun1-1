# EduPlatform

Firebase(Auth + Firestore) 기반 영어 학습 관리 웹앱. Vite + React + TypeScript + Tailwind.

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기
npm run dev
```

## GitHub Pages 배포 (가장 쉬운 방법 — Secrets/Actions 필요 없음)

1. Firebase 콘솔에서 프로젝트 생성 → Authentication에서 "익명" 로그인 활성화 → Firestore Database 생성.
2. `.env.local` 파일을 만들고 (`.env.example` 참고) 실제 Firebase 설정값과 관리자 비밀번호를 채워넣기.
3. `vite.config.ts`의 `base: '/eduplatform/'`을 본인 GitHub 저장소 이름으로 수정 (예: 저장소명이 `my-school`이면 `base: '/my-school/'`).
4. GitHub에 빈 저장소 생성 후 `git push` (README 앞부분 참고).
5. 로컬에서 아래 명령 실행:
   ```bash
   npm install
   npm run deploy
   ```
   이 명령이 빌드 후 결과물(`dist` 폴더)을 자동으로 `gh-pages` 브랜치에 올려줍니다.
6. 저장소 Settings → Pages → Source를 **"Deploy from a branch"**로, Branch는 **`gh-pages`**로 선택.
7. Firebase 콘솔 → Authentication → Settings → Authorized domains 에 `<username>.github.io` 추가.

이후 코드를 수정하면 `npm run deploy` 한 번만 다시 실행하면 됩니다.

## 보안 관련 필수 확인 사항

- 관리자 비밀번호는 빌드 시 번들에 포함되므로(클라이언트 코드 특성상) 브라우저 개발자도구로 노출될 수 있습니다. 실제 서비스라면 Firebase Auth의 커스텀 클레임/서버 검증 방식으로 전환을 권장합니다.
- Firestore 보안 규칙을 반드시 설정하세요. 기본 테스트 모드로 두면 누구나 학생 PIN과 성적 데이터를 읽고 쓸 수 있습니다.
