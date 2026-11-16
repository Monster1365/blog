import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // About 페이지가 런타임에 다시 렌더링될 때도 마크다운 파일을 읽을 수 있게 함께 배포
  outputFileTracingIncludes: {
    "/about": ["./content/**/*"],
  },
  async redirects() {
    // 카테고리 → 태그로 이름이 바뀐 예전 주소
    return [{ source: "/categories", destination: "/tags", permanent: true }];
  },
};

export default nextConfig;
