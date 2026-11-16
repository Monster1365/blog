# Monster K (M.K.)

직접 만들고 부딪히며 배운 것을 기록하는 개발 블로그입니다.

- 사이트: https://k-coding-blog.vercel.app
- 기반 테마: [Sleek](https://github.com/janczizikow/sleek) (MIT License) — 디자인을 Next.js로 옮겨 사용

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 프레임워크 | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| 스타일 | Sass (Sleek 테마에서 옮김) |
| 데이터베이스 | Neon PostgreSQL + Drizzle ORM |
| 마크다운 | remark / rehype (GFM, 한글 강조 보완), shiki 코드 하이라이팅 |
| 메일 | Resend (Contact 폼) |
| 배포 | Vercel (함수 리전 `sin1`) |

## 브랜치와 배포

| Git 브랜치 | Vercel | 주소 | Neon DB 브랜치 |
| --- | --- | --- | --- |
| `main` | Production (공개) | https://k-coding-blog.vercel.app | `main` |
| `develop` | Preview (Vercel 로그인 필요) | https://dev-k-coding-blog.vercel.app | `develop` |

작업은 `develop`에서 하고, 확인이 끝나면 `main`에 합칩니다.

## 로컬에서 실행하기

Node.js 20.9 이상이 필요합니다.

```shell
cp .env.example .env.local   # DATABASE_URL 등 채우기 (Neon develop 브랜치 권장)
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

### 데이터베이스 (Neon + Drizzle)

- 스키마는 [db/schema.ts](db/schema.ts), 마이그레이션 파일은 `db/migrations/`에 있습니다.
- 스키마를 바꾸면 `develop`에 먼저 적용하고, `main`에는 Production에 합치기 전에 적용합니다.

```shell
npm run db:generate   # 스키마 변경 → 마이그레이션 SQL 생성
npm run db:migrate    # .env.local의 DATABASE_URL에 마이그레이션 적용
npm run db:studio     # Drizzle Studio로 데이터 보기
```

### 환경 변수

| 이름 | 필수 | 내용 |
| --- | --- | --- |
| `DATABASE_URL` | 필수 | Neon 연결 문자열 |
| `AUTH_SECRET` | 관리 페이지 필수 | 관리자 세션 쿠키 서명용 비밀값 (32자 이상) |
| `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | 관리 페이지 필수 | GitHub OAuth App. 콜백 주소: `<사이트 주소>/api/auth/github/callback` |
| `ADMIN_GITHUB_LOGIN` | 선택 | 관리자로 허용할 GitHub 아이디 (기본값 `Monster1365`) |
| `RESEND_API_KEY` | Production 필수 | Contact 메일 발송용 Resend API 키 (로컬에서 비우면 발송 생략) |
| `CONTACT_TO_EMAIL` | Production 필수 | Contact 메시지를 받을 주소 |
| `CONTACT_FROM_EMAIL` | 선택 | 보내는 주소 (기본값: Resend 테스트 주소) |
| `CONTACT_HASH_SECRET` | 선택 | IP 해시용 비밀값 (기본값: `RESEND_API_KEY`) |

## 디렉토리 구조

```
app/            # 페이지와 Server Action (홈, 글 상세 /[slug], tags, about, contact)
app/admin/      # 관리 페이지 (글·태그·댓글 관리, GitHub 로그인 필요)
app/api/auth/   # GitHub 로그인 (OAuth 시작·콜백)
components/     # Header, Footer, Hero, PostCard, Comments, ContactForm, admin/ 등
lib/            # 데이터 조회(posts, admin), 댓글, 로그인(auth), 마크다운 변환, Contact 처리, 사이트 설정
db/             # Drizzle 스키마·클라이언트·마이그레이션
styles/         # Sass (Sleek 테마 구조: abstracts / base / components / layout / pages)
content/        # About 페이지 마크다운
public/images/  # 대표 이미지
```

## 할 일

이전 단계(Jekyll → Next.js 전환, Neon 이관, Vercel 배포, Resend Contact)는 모두 끝났습니다.

### 관리 페이지 (`/admin`)
- [x] GitHub 로그인 (Monster1365 계정만 허용, 서명된 세션 쿠키 7일)
- [x] 글 목록 (숨긴 글 포함), 태그로 걸러 보기
- [x] 글 작성·수정·삭제 (삭제하면 댓글도 함께 삭제)
- [x] 글 숨기기·다시 보이기
- [x] 태그 정리 (이름 바꾸기·합치기, 삭제, 태그별 글 수)
- [x] 댓글 목록과 삭제
- [x] 글을 바꾸면 사이트에 바로 반영 (`updateTag`)
- [ ] GitHub OAuth App 만들기 (Production용, Preview용 각각) + Vercel 환경 변수 등록
- [ ] 이미지 업로드 (지금은 `public/images/posts/`에 파일을 넣고 이름을 적는 방식)
- [ ] 본문 미리보기

### 댓글
- [x] 글마다 댓글 달기 (바로 게시)
- [x] 작성자 표시: 같은 글 안에서 브라우저별로 익명1, 익명2…, 관리자는 "글쓴이"
- [x] 스팸 방지 (허니팟, 2초 이내 제출 차단, 같은 IP 10분에 5개·사이트 전체 1시간에 100개)
- [x] 삭제는 관리 페이지에서 관리자만
- [x] 댓글은 요청마다 읽어서 항상 최신 상태로 표시 (글 본문은 미리 만든 페이지)
- [x] Neon `develop`에 `comments`, `comment_participants` 마이그레이션 적용
- [ ] Neon `main`에 마이그레이션 적용 (main에 합치기 전)

### 사이트
- [ ] 홈 글 목록 페이지네이션 (글이 늘어나면)
- [ ] 메인 배경 이미지와 Ren'Py 글 대표 이미지를 직접 고른 이미지로 교체
- [ ] 파비콘과 아이콘 교체
- [ ] 본인 LinkedIn 링크 추가
- [ ] Resend에서 발신 도메인 인증 후 `CONTACT_FROM_EMAIL` 설정 (그 전에는 Resend 가입 이메일로만 받을 수 있음)

### 글쓰기
- [ ] Ren'Py 시리즈 이어 쓰기 (충돌 검사, 카메라 구조 등)
- [ ] Ren'Py 글 다듬기 (`= 그림제시` 자리 그림 넣기, 중복된 코드 블록, 오타)

## 라이선스

[Sleek](https://github.com/janczizikow/sleek) 테마(© Jan Czizikow)를 기반으로 하며, 테마에서 가져온 스타일은 [MIT License](LICENSE.txt)를 따릅니다.
