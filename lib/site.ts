/** 사이트 설정 (기존 Jekyll `_config.yml`에서 옮김) */
export const site = {
  title: "Monster K",
  /** 헤더 로고 등 짧게 쓸 때 */
  shortTitle: "M.K.",
  author: "SeoHyun Han",
  description:
    "Monster K(M.K.) — SeoHyun Han's dev blog, documenting what I learn, build, and discover through hands-on development, including game development with Ren'Py and Python.",
  tagline:
    "Documenting what I learn, build, and discover through hands-on development.",
  heroImage: "sleek",
  githubUsername: "Monster1365",
  navigation: [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ],
} as const;

/** 배포 주소. Vercel에서는 VERCEL_PROJECT_PRODUCTION_URL이 자동으로 들어옵니다. */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");
