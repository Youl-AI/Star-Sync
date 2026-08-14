export type SkyTier = "full" | "lite" | "static";

/**
 * 소프트웨어 렌더러의 이름들.
 *
 * 크롬은 GPU 드라이버를 못 믿을 때 조용히 소프트웨어 래스터라이저로 내려간다.
 * WebGL은 그대로 "된다" — 다만 모든 픽셀을 CPU가 그린다. 화면을 덮는 셰이더에
 * 이것은 곧 CPU 코어 하나를 통째로 태우는 일이고, 실제로 그런 기기에서
 * 메인 페이지가 CPU 50%를 먹는다는 제보를 받았다(2026-08-14).
 *
 * 그래서 "WebGL이 있는가"가 아니라 "GPU가 그리는가"를 묻는다.
 */
const SOFTWARE_RENDERERS = /swiftshader|llvmpipe|software|basic render|generic renderer|mesa offscreen/i;

export function isSoftwareRenderer(renderer: string | null): boolean {
  return renderer !== null && SOFTWARE_RENDERERS.test(renderer);
}

export function detectSkyTier(o: {
  reducedMotion: boolean;
  isMobile: boolean;
  webgl: boolean;
  /** GPU 없이 CPU가 픽셀을 그리는 상태. 이때 하늘 셰이더는 사치가 아니라 민폐다. */
  softwareRenderer?: boolean;
}): SkyTier {
  if (o.reducedMotion || !o.webgl || o.softwareRenderer) return "static";
  return o.isMobile ? "lite" : "full";
}
