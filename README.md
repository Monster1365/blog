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

```shell
bundle install
bundle exec jekyll serve
```

브라우저에서 `http://localhost:4000/blog/`로 접속합니다.

CSS·JS·이미지를 다시 빌드할 때는 Gulp를 씁니다.

```shell
npm install
npm start        # gulp: 빌드 후 BrowserSync로 http://localhost:3000 실행
```

> npm 의존성이 2017~2018년 버전이라 최신 Node에서는 설치가 실패할 수 있습니다. 아래 할 일 목록을 참고하세요.

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

### 사이트 기본 정리
- [x] 테마 샘플 글 삭제
- [x] `_config.yml`의 description, 원작자 LinkedIn 링크 정리
- [x] 홈 페이지 제목(`index.md`) 수정
- [x] README 다시 쓰기
- [ ] 블로그 이름 정하기 (`_config.yml`의 `title`)
- [ ] 본인 LinkedIn 링크 추가 (`social.links`)
- [ ] `_includes/head.html`의 `apple-mobile-web-app-title`("Sleek") 변경

### Contact (Resend로 다시 구현)
- [ ] 메일 발송용 서버리스 함수 만들기 (GitHub Pages는 정적 호스팅이라 Resend API 키를 숨길 서버 쪽 코드가 필요)
- [ ] Resend 가입, API 키 발급, 발신 도메인 인증
- [ ] API 키를 서버리스 함수의 환경 변수로 등록
- [ ] `_includes/form.html`을 새 엔드포인트로 보내도록 수정 (fetch로 비동기 전송)
- [ ] 스팸 방지 추가 (허니팟 필드, 허용 Origin 제한, 요청 횟수 제한 등)
- [ ] 페이지 HTML에서 이메일 주소 노출 제거
- [ ] `contact.md` 본문을 테마 설명 대신 직접 작성
- [ ] 기존 Formspree 관련 코드와 문구 제거

### 디자인
- [ ] 메인 배경 이미지(`hero_img`) 교체
- [ ] Ren'Py 글 대표 이미지(`featured-img`) 교체
- [ ] 파비콘과 아이콘(`assets/img/icons/`) 교체
- [ ] 쓰지 않는 테마 샘플 이미지 삭제 (`shane-rounce-*`, `emile-perron-*`, `sleek*`, 루트의 `sleek.jpg`)

### 개발 환경과 배포
- [ ] `bundle install`로 로컬 Jekyll 실행 환경 만들기
- [ ] npm 의존성 업그레이드 또는 호환되는 Node 버전 고정
- [ ] 서비스 워커 정리 (캐시 경로에 `/blog`가 빠져 있음. 고치거나 `service_worker: false`로 끄기)
- [ ] 사용하지 않는 `.travis.yml` 삭제
- [ ] Disqus shortname(`Monster1365`) 실제 등록 여부 확인

### 글쓰기
- [ ] Ren'Py 시리즈 이어 쓰기 (충돌 검사, 카메라 구조 등)

## 라이선스

[Sleek](https://github.com/janczizikow/sleek) 테마(© Jan Czizikow)를 기반으로 하며, 테마 코드는 [MIT License](LICENSE.txt)를 따릅니다.
