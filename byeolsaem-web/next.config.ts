import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: false,
};

/**
 * 칼럼 본문은 .mdx로 쓴다. 라우트로 쓰는 것이 아니라 모듈로 불러 읽으므로
 * `pageExtensions`는 건드리지 않는다 — 글은 `src/content/blog/`에 있고
 * `/blog/[slug]`가 그것을 가져다 쓴다(src/content/blog/index.ts 참고).
 */
const withMDX = createMDX({});

export default withMDX(nextConfig);
