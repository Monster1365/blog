# Monster K (M.K.)

직접 만들고 부딪히며 배운 것을 기록하는 개발 블로그입니다.

- 사이트: https://k-coding-blog.vercel.app
- 관리 페이지: https://k-coding-blog.vercel.app/admin (GitHub 로그인)

## 주요 기능

**블로그**
- 글 목록, 글 상세, 태그별 모아 보기, About, Contact
- 홈 왼쪽 글 목록: 최근 글과 섹션별 목록 (섹션을 누르면 하위 섹션과 글이 펼쳐짐, 휴대폰에서는 접는 버튼)
- 글마다 익명 댓글 (같은 글 안에서 브라우저별로 익명1, 익명2…, 관리자는 "글쓴이")
- Contact 폼 → Resend로 메일 발송 (허니팟·요청 횟수 제한으로 스팸 방지)

**관리 페이지 (`/admin`)**
- 대시보드: 글·댓글·태그 수, 발행 주기, 월별 발행, 일별 방문자, 인기 글, 유입 경로
- 글 작성·수정·삭제·숨기기, 태그 이름 바꾸기·삭제, 댓글 삭제
- 섹션: 글을 폴더처럼 묶는 범주 (태그와 별개, 하위 섹션 가능, 섹션과 글의 순서 직접 지정)
- 글쓰기 편집기: 서식 도구 모음과 단축키, 미리보기, Markdown 파일 불러오기, 이미지 끌어다 놓기·붙여 넣기
- 사이트 설정: 블로그 이름, 로고, 설명, 배너 이미지·소개글, 파비콘, About
- 바꾼 내용은 저장하는 즉시 사이트에 반영됩니다.

**개인정보**
- 방문 통계는 IP 대신 하루마다 바뀌는 해시만 저장하고, 봇과 관리자 본인의 방문은 세지 않습니다.
- 댓글과 Contact 메시지도 IP를 해시로만 저장합니다.

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| 스타일 | Sass ([Sleek](https://github.com/janczizikow/sleek) 테마 디자인을 옮김) |
| 데이터베이스 | Neon PostgreSQL + Drizzle ORM (글·댓글·이미지·방문 기록·사이트 설정) |
| 마크다운 | remark / rehype (GFM, 한글 강조 보완), shiki 코드 하이라이팅 |
| 로그인 | GitHub OAuth (관리자 계정 하나만 허용) |
| 메일 | Resend |
| 배포 | Vercel (함수 리전 `sin1`, 싱가포르) |

## 브랜치와 배포

| Git 브랜치 | Vercel | 주소 | Neon DB 브랜치 |
| --- | --- | --- | --- |
| `main` | Production (공개) | https://k-coding-blog.vercel.app | `main` |
| `develop` | Preview (Vercel 로그인 필요) | https://dev-k-coding-blog.vercel.app | `develop` |

작업은 `develop`에서 하고, Preview에서 확인한 뒤 `main`에 합칩니다. 두 환경은 DB가 따로라 Preview에서 쓴 글은 Production에 보이지 않습니다.

DB 스키마를 바꿨다면 순서가 중요합니다.

1. `develop` DB에 마이그레이션을 적용하고 Preview에서 확인합니다.
2. `main` DB에 마이그레이션을 적용합니다.
3. `develop`을 `main`에 합칩니다. (코드가 먼저 올라가면 새 테이블이 없어 오류가 납니다)

## 로컬에서 실행하기

Node.js 20.9 이상이 필요합니다.

```shell
cp .env.example .env.local   # DATABASE_URL 등 채우기 (Neon develop 브랜치 권장)
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

### 데이터베이스

스키마는 [db/schema.ts](db/schema.ts), 마이그레이션은 `db/migrations/`에 있습니다.

```shell
npm run db:generate   # 스키마 변경 → 마이그레이션 SQL 생성
npm run db:migrate    # .env.local의 DATABASE_URL에 마이그레이션 적용
npm run db:studio     # Drizzle Studio로 데이터 보기
```

### 환경 변수

| 이름 | 필수 | 내용 |
| --- | --- | --- |
| `DATABASE_URL` | 필수 | Neon 연결 문자열 |
| `AUTH_SECRET` | 관리 페이지 | 관리자 세션 쿠키 서명용 비밀값 (32자 이상) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | 관리 페이지 | GitHub OAuth App. 콜백 주소: `<사이트 주소>/api/auth/github/callback` (환경마다 앱을 따로 만듭니다) |
| `ADMIN_GITHUB_LOGIN` | 선택 | 관리자로 허용할 GitHub 아이디 (기본값 `Monster1365`) |
| `RESEND_API_KEY` | Production | Contact 메일 발송용 Resend API 키 (로컬에서 비우면 발송 없이 저장만) |
| `CONTACT_TO_EMAIL` | Production | Contact 메시지를 받을 주소 |
| `CONTACT_FROM_EMAIL` | 선택 | 보내는 주소. 비우면 Resend 테스트 주소를 쓰며, 이때는 Resend 가입 이메일로만 받을 수 있습니다 |
| `CONTACT_HASH_SECRET` | 선택 | IP 해시용 비밀값 (기본값: `RESEND_API_KEY`) |

## 디렉토리 구조

```
app/
  page.tsx, [slug]/, tags/, about/, contact/   # 공개 페이지 (+ 댓글·Contact Server Action)
  admin/        # 관리 페이지: 대시보드, posts/, tags/, comments/, settings/, login/
  api/auth/     # GitHub 로그인 (OAuth 시작·콜백)
  api/views/    # 방문 기록 받기
  media/[id]/   # DB에 저장한 이미지 보내기
components/     # Header, Footer, Hero, PostCard, Comments, ContactForm …
  admin/        # 관리 화면: 편집기(MarkdownEditor), 이미지 칸, 폼, 차트(charts/)
lib/            # 데이터 조회·처리: posts, comments, contact, auth, stats, settings, markdown …
db/             # Drizzle 스키마·클라이언트·마이그레이션
styles/         # Sass (abstracts / base / components / layout / pages)
public/         # 기본 이미지·파비콘 (관리 페이지에서 올린 이미지는 DB `images` 테이블)
```

## 라이선스

[Sleek](https://github.com/janczizikow/sleek) 테마(© Jan Czizikow)를 기반으로 하며, 테마에서 가져온 스타일은 [MIT License](LICENSE.txt)를 따릅니다.
