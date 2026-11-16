# Blog

직접 만들고 부딪히며 배운 것을 기록하는 개발 블로그입니다.

- 사이트: https://monster1365.github.io/blog
- 기반 테마: [Sleek](https://github.com/janczizikow/sleek) (Jekyll, MIT License)

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 정적 사이트 생성 | Jekyll (kramdown, rouge) |
| 플러그인 | jekyll-seo-tag, jekyll-sitemap |
| 에셋 빌드 | Gulp 4 (Sass, Browserify/Babel, 이미지 리사이징, sw-precache) |
| 댓글 | Disqus |
| 배포 | GitHub Pages |

## 로컬에서 실행하기

> 위 기술 스택은 지금 배포 중인 `master`(Jekyll) 기준입니다. `develop` 브랜치는 Next.js로 옮기는 중입니다.

### develop (Next.js)

Node.js 20.9 이상이 필요합니다.

```shell
cp .env.example .env.local   # DATABASE_URL 채우기
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
```

### 데이터베이스 (Neon + Drizzle)

- Neon 프로젝트 `blog` (싱가포르 리전, PostgreSQL 18)
  - `main` 브랜치: Production용
  - `develop` 브랜치: 개발용. 로컬 `.env.local`은 이 브랜치를 가리킵니다.
- 스키마는 [db/schema.ts](db/schema.ts), 마이그레이션 파일은 `db/migrations/`에 있습니다.

```shell
npm run db:generate   # 스키마 변경 → 마이그레이션 SQL 생성
npm run db:migrate    # .env.local의 DATABASE_URL에 마이그레이션 적용
npm run db:studio     # Drizzle Studio로 데이터 보기
npm run db:import-posts             # _posts/*.md를 posts 테이블로 옮기기 (slug 기준 upsert)
npm run db:import-posts -- --dry-run  # DB에 쓰지 않고 변환 결과만 확인
```

### master (Jekyll)

```shell
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000/blog/`로 접속합니다.

## 디렉토리 구조

```
blog-site/
├── _config.yml      # 사이트 설정 (제목, 작성자, 네비게이션, baseurl 등)
├── _posts/          # 블로그 글
├── _layouts/        # default / page / post / compress
├── _includes/       # header, footer, card, disqus, form 등 HTML 조각
├── _sass/           # SCSS 소스
├── _js/scripts.js   # JS 소스 → assets/js/bundle.js
├── _img/posts/      # 대표 이미지 원본 (gulp가 여러 크기로 변환)
├── assets/          # 빌드 결과물 (css, js, 이미지, 아이콘)
├── index.md         # 홈 (글 목록)
├── about.md         # 소개
├── contact.md       # 연락하기
├── categories.md    # 카테고리별 글 목록
└── sw.js            # 서비스 워커
```

## 글 쓰기

`_posts/`에 `YYYY-MM-DD-제목.md` 형식으로 파일을 만들고 front matter를 작성합니다.

```yaml
---
layout: post
title: "글 제목"
featured-img: 이미지이름        # 선택. _img/posts/이미지이름.jpg
categories: [Renpy, Game, Python]
---
```

대표 이미지를 쓰려면 `.jpg` 원본을 `_img/posts/`에 넣고 `gulp img`를 실행합니다. `assets/img/posts/`에 `_lg`, `_md`, `_sm`, `_thumb` 등 여러 크기가 만들어집니다.

## 할 일

> 블로그를 **Next.js + Vercel + Neon PostgreSQL**로 옮기는 중입니다. 작업은 `develop` 브랜치에서 진행하고, 전환이 끝나면 `master`에 합칩니다.

### 사이트 기본 정리
- [x] 테마 샘플 글 삭제
- [x] `_config.yml`의 description, 원작자 LinkedIn 링크 정리
- [x] 홈 페이지 제목(`index.md`) 수정
- [x] README 다시 쓰기
- [ ] 블로그 이름 정하기
- [ ] 본인 LinkedIn 링크 추가

### 1. Next.js 골격
- [x] Next.js 프로젝트 생성 (App Router, TypeScript)
- [x] 겹치는 Jekyll 빌드 설정 제거 (`.babelrc`, `gulpfile.babel.js`, `package-lock.json`, `.eslintrc`, `.eslintignore`)
- [x] 페이지 구성: 홈(글 목록), 글 상세(`/[slug]`), 카테고리, About, Contact(준비 중 안내), 404
- [ ] 홈 글 목록 페이지네이션 (글이 늘어나면)

### 2. 디자인 이식
- [x] `_sass/` 구조를 `styles/`로 옮기기 (`@import` → `@use`, 한글 폰트·줄바꿈 보완)
- [x] `_layouts/`, `_includes/`를 React 컴포넌트로 바꾸기 (`components/`: Header, Footer, Hero, PostCard)
- [x] jQuery 헤더 동작(모바일 메뉴, 스크롤 시 숨김)을 React로 옮기기
- [ ] Contact 폼 스타일(`_btn.scss`, `_form.scss`) 옮기기 (6단계에서)
- [ ] 메인 배경 이미지와 Ren'Py 글 대표 이미지를 직접 고른 이미지로 교체
- [ ] 파비콘과 아이콘 교체

### 3. Neon DB
- [x] Neon 프로젝트 생성, 개발용 브랜치 분리
- [x] Drizzle ORM + `@neondatabase/serverless` 설정
- [x] `posts` 테이블 만들기: `id`, `slug`(unique), `title`, `content`(markdown), `excerpt`, `featured_img`, `categories`(text[]), `published`, `published_at`, `created_at`, `updated_at`
- [x] `develop` 브랜치에 마이그레이션 적용
- [ ] `main` 브랜치에 마이그레이션 적용 (Production 배포 전)

### 4. 글 이관
- [x] `_posts/*.md`의 front matter를 읽어 `posts` 테이블에 넣는 스크립트 작성 ([scripts/import-posts.ts](scripts/import-posts.ts))
- [x] 기존 글을 Neon `develop` 브랜치로 이관 (Ren'Py 글 1개)
- [ ] Neon `main` 브랜치로 이관 (Production 배포 전, 마이그레이션 적용 후)

### 5. 렌더링
- [x] 마크다운을 HTML로 변환 (remark/rehype, GFM, 한글 강조 보완), 코드 하이라이팅 (shiki)
- [x] `use cache` + `cacheLife("hours")` + `cacheTag("posts")`로 캐시 (1시간마다 갱신)
- [ ] 글을 바꿨을 때 바로 반영하는 방법 만들기 (`revalidateTag("posts", "max")`를 부르는 API 등)
- [x] 대표 이미지를 `public/images/posts/`에 두고 `next/image`로 표시

### 6. Contact (Resend)
- [ ] Resend 가입, API 키 발급, 발신 도메인 인증
- [ ] `/api/contact` Route Handler에서 Resend로 메일 발송
- [ ] 스팸 방지 (허니팟 필드, Origin 검사, 요청 횟수 제한)
- [ ] 페이지에 이메일 주소가 노출되지 않게 하기
- [ ] Contact 페이지 본문 직접 작성

### 7. 배포 (Vercel)
- [ ] Vercel 프로젝트를 GitHub 저장소와 연결
- [ ] 환경 변수 `DATABASE_URL`, `RESEND_API_KEY`를 Preview와 Production에 등록
- [ ] `develop`은 Preview, `master`는 Production으로 배포

### 8. 전환 마무리
- [ ] Jekyll 관련 파일 삭제 (`_config.yml`, `_layouts/`, `_includes/`, `Gemfile`, gemspec, Gulp 설정, `sw.js`, `.travis.yml`, 테마 샘플 이미지 등)
- [ ] GitHub Pages 끄기
- [ ] 주소 변경 안내 (`monster1365.github.io/blog` → Vercel 도메인)
- [ ] Disqus 댓글을 계속 쓸지 결정
- [ ] DB로 옮긴 뒤 글 쓰는 방식 정하기 (관리자 페이지, 마크다운 업로드 스크립트 등)

### 글쓰기
- [ ] Ren'Py 시리즈 이어 쓰기 (충돌 검사, 카메라 구조 등)

## 라이선스

[Sleek](https://github.com/janczizikow/sleek) 테마(© Jan Czizikow)를 기반으로 하며, 테마 코드는 [MIT License](LICENSE.txt)를 따릅니다.
