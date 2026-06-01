# i-STAR 3주년 행사 초대장 웹앱

모바일 최적화 행사 초대장 · 참석 여부 수집 · 개인 QR 입장권 발급 · 현장 체크인 시스템

---

## 📁 전체 파일 구조

```
i-star-invitation/
├── public/
│   ├── assets/                        ← ★ 이미지·영상을 여기에 넣으세요
│   │   ├── invitation-card.jpg
│   │   ├── invitation-video.mp4
│   │   └── invitation-video-poster.jpg
│   └── sample-invitees.csv            ← CSV 업로드 예시 파일
├── scripts/
│   └── seed-admin.ts                  ← 관리자 계정 생성 스크립트
├── src/
│   ├── app/
│   │   ├── page.tsx                   ← 첫 화면 (이름 입력)
│   │   ├── invitation/page.tsx        ← 초대장 + RSVP + QR 카드
│   │   ├── invite/[token]/page.tsx    ← 개인 초대 링크 진입
│   │   ├── admin/
│   │   │   ├── login/page.tsx         ← 관리자 로그인
│   │   │   ├── page.tsx               ← 대시보드
│   │   │   ├── invitees/page.tsx      ← 초대자 관리
│   │   │   └── checkin/page.tsx       ← 현장 QR 체크인
│   │   └── api/                       ← API Routes
│   ├── components/
│   │   ├── InvitationSlider.tsx       ← 이미지·영상 슬라이더
│   │   ├── QRCard.tsx                 ← QR 초대권 카드
│   │   ├── LoadingSpinner.tsx
│   │   └── admin/AdminNav.tsx
│   ├── config/
│   │   └── event.ts                   ← ★ 행사 정보 설정 파일
│   └── lib/
│       ├── supabase/server.ts
│       ├── auth.ts
│       ├── tokens.ts
│       └── types.ts
├── supabase/
│   └── schema.sql                     ← DB 생성 SQL
├── .env.example                       ← 환경 변수 샘플
└── package.json
```

---

## 🚀 처음 시작하기 (단계별 가이드)

### 1단계 — Node.js 설치 확인

터미널(macOS: 터미널 앱 / Windows: PowerShell)에서:

```bash
node -v
```

`v18` 이상이 표시되면 OK. 없으면 https://nodejs.org 에서 LTS 버전 설치.

---

### 2단계 — Supabase 프로젝트 만들기

1. https://supabase.com 접속 → **Start your project** 클릭
2. GitHub 계정으로 회원가입
3. **New project** 클릭 → 이름: `i-star-invitation`, 지역: `Northeast Asia (Seoul)` 선택
4. 비밀번호는 안전한 것으로 설정 후 **Create new project** 클릭 (약 1분 대기)

**API 키 복사:**
- 좌측 메뉴 → **Project Settings** → **API**
- `URL` 복사
- `anon public` 키 복사
- `service_role secret` 키 복사 (눈 모양 클릭)

**데이터베이스 생성:**
1. 좌측 메뉴 → **SQL Editor** → **New query**
2. `supabase/schema.sql` 파일 전체 내용을 붙여넣기
3. **Run** 버튼 클릭
4. "Success. No rows returned" 메시지 확인

---

### 3단계 — 프로젝트 설정

```bash
# 프로젝트 폴더로 이동 (i-star-invitation 폴더가 있는 곳)
cd i-star-invitation

# 의존성 설치
npm install

# 환경 변수 파일 복사
cp .env.example .env
```

`.env` 파일을 메모장/VSCode로 열어 아래 값을 채우세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co    ← 2단계에서 복사한 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...                  ← anon public 키
SUPABASE_SERVICE_ROLE_KEY=eyJh...                      ← service_role 키
ADMIN_SECRET_KEY=무작위32자이상문자열                    ← 아래 방법으로 생성
ADMIN_EMAIL=admin@i-star.com                           ← 원하는 관리자 이메일
ADMIN_PASSWORD=강력한비밀번호123!                       ← 원하는 비밀번호
NEXT_PUBLIC_APP_URL=http://localhost:3000               ← 로컬 개발용 (배포 후 변경)
```

`ADMIN_SECRET_KEY` 생성 방법:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
출력된 64자리 문자열을 복사해서 붙여넣기.

---

### 4단계 — 관리자 계정 생성

```bash
npx tsx scripts/seed-admin.ts
```

"✅ 관리자 계정 생성/갱신 완료" 메시지 확인.

---

### 5단계 — 로컬 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속.

- **초대장 화면:** http://localhost:3000
- **관리자 대시보드:** http://localhost:3000/admin

---

## 🖼️ 이미지·영상 교체 방법

### 초대장 이미지 교체
1. `public/assets/` 폴더를 파인더(맥) 또는 탐색기(윈도우)에서 연다
2. `invitation-card.jpg` 파일을 삭제
3. 새 초대장 이미지 파일을 `invitation-card.jpg` 이름으로 저장
4. **파일명은 반드시 `invitation-card.jpg`로 유지**

### 초대 영상 교체
1. 같은 폴더에서 `invitation-video.mp4` 파일을 새 영상으로 교체
2. **파일명은 반드시 `invitation-video.mp4`로 유지**

### 영상 썸네일 교체
1. `invitation-video-poster.jpg` 파일을 새 이미지로 교체

### 권장 규격
| 파일 | 권장 크기 | 형식 |
|------|-----------|------|
| invitation-card.jpg | 900×1200px 이하 | JPG/PNG |
| invitation-video.mp4 | 540×720px, 30초 이내 | MP4 (H.264) |
| invitation-video-poster.jpg | 540×720px | JPG |

---

## ⚙️ 행사 정보 수정 방법

`src/config/event.ts` 파일을 열어 수정하면 모든 화면에 자동 반영됩니다.

```typescript
export const EVENT_CONFIG = {
  name: 'i-STAR 3주년 행사',     // ← 행사명
  date: '2026년 6월 28일(일)',   // ← 날짜 (한글)
  dateDisplay: '2026. 06. 28. SUN', // ← 날짜 (카드 표시용)
  time: '오후 2시',              // ← 시간
  venue: '그랜드 인터컨티넨탈 서울 파르나스', // ← 장소명
  venueFloor: '5층',             // ← 층수
  mapUrl: 'https://...',         // ← 지도 링크 (카카오맵/네이버맵)
  slogan1: '뜻을 잇고 세상을 잇다.',
  slogan2: '본이 되고 꿈이 되다.',
  brandColor: '#006241',         // ← 포인트 컬러 (HEX)
  ...
};
```

---

## 👥 초대자 등록 방법

### 방법 A: 관리자 페이지에서 직접 추가
1. http://localhost:3000/admin/invitees 접속
2. **추가** 버튼 클릭
3. 이름, 전화번호 뒤 4자리 입력 후 저장

### 방법 B: CSV 파일로 일괄 등록
1. `public/sample-invitees.csv` 파일을 엑셀에서 열기
2. 양식에 맞게 초대자 목록 작성:
   ```
   이름,전화번호뒤4자리,메모
   홍길동,1234,VIP
   김철수,,
   ```
3. **다른 이름으로 저장** → 파일 형식: **CSV(쉼표로 분리)**
4. 관리자 페이지 → **CSV 업로드** 버튼 클릭

---

## 📤 Vercel + Supabase 배포 방법

### 1. GitHub에 코드 올리기
1. https://github.com 에서 새 저장소(Repository) 생성
2. 터미널에서:
```bash
git init
git add .
git commit -m "i-STAR invitation app"
git remote add origin https://github.com/[내계정]/[저장소명].git
git push -u origin main
```

### 2. Vercel에 배포
1. https://vercel.com 접속 → GitHub으로 로그인
2. **Add New Project** → 위에서 만든 저장소 선택 → **Import**
3. Framework: **Next.js** (자동 감지)
4. **Environment Variables** 섹션에서 `.env` 파일의 모든 항목 입력
   - `NEXT_PUBLIC_APP_URL`은 배포 후 실제 Vercel 주소로 수정 필요
5. **Deploy** 클릭 (약 2~3분 대기)

### 3. 배포 완료 후 APP_URL 수정
1. Vercel 대시보드에서 배포된 URL 확인 (예: `https://i-star.vercel.app`)
2. Vercel 프로젝트 → **Settings** → **Environment Variables**
3. `NEXT_PUBLIC_APP_URL` 값을 실제 URL로 변경
4. **Redeploy** 클릭

### 4. 관리자 계정 재생성 (배포 환경)
```bash
NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=... ADMIN_PASSWORD=... npx tsx scripts/seed-admin.ts
```

---

## 📱 실제 사용 흐름

### 초대자 등록 단계 (행사 전)
1. 관리자 페이지(`/admin/invitees`)에서 초대자 등록
2. 각 초대자의 **초대 링크 복사** 버튼으로 개인 링크 복사
3. 카카오톡/문자로 링크 발송

### 초대자 입장 단계 (행사 당일)
1. 현장 담당자 스마트폰에서 `/admin/checkin` 접속
2. **QR 카메라 스캔** 버튼 클릭
3. 참석자의 QR 초대권 스캔
4. 초록색 → 이름 확인 후 입장
5. 주황/빨간색 → 담당자 확인 후 처리

---

## 🔒 보안 참고사항

- QR 코드에는 이름·전화번호가 포함되지 않습니다 (무작위 토큰만 포함)
- QR 중복 사용 방지는 DB 레벨에서 원자적으로 처리됩니다
- 관리자 세션은 8시간 후 자동 만료됩니다
- `.env` 파일은 절대 GitHub에 올리지 마세요 (`.gitignore`에 포함됨)

---

## 🛠️ 자주 묻는 질문

**Q: 이름을 잘못 입력하면 어떻게 되나요?**
A: "초대 대상자 명단에서 확인되지 않습니다" 메시지가 표시됩니다.

**Q: 동일한 이름이 여러 명인 경우는요?**
A: 자동으로 휴대전화 번호 뒤 4자리 입력 화면이 표시됩니다.

**Q: 참석 신청 후 취소할 수 있나요?**
A: 초대장 페이지에서 "참석 취소하기" 버튼으로 변경 가능합니다.

**Q: QR를 캡처 후 다른 사람이 먼저 사용하면요?**
A: 현장 담당자가 QR 스캔 후 화면에 표시되는 이름을 직접 확인합니다.

**Q: 관리자 비밀번호를 바꾸고 싶어요.**
A: `.env`의 `ADMIN_PASSWORD`를 변경 후 `npx tsx scripts/seed-admin.ts` 재실행.

---

*i-STAR 3주년 행사 초대장 시스템*
