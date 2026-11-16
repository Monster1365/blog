import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      // 썸네일 업로드(최대 3MB) + multipart 오버헤드. Vercel 함수 요청 한도(4.5MB) 안쪽.
      bodySizeLimit: "4mb",
    },
  },
  async redirects() {
    // 카테고리 → 태그로 이름이 바뀐 예전 주소
    return [{ source: "/categories", destination: "/tags", permanent: true }];
  },
};

export default nextConfig;
