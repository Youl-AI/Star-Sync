export type SkyTier = "full" | "lite" | "static";

export function detectSkyTier(o: { reducedMotion: boolean; isMobile: boolean; webgl: boolean }): SkyTier {
  if (o.reducedMotion || !o.webgl) return "static";
  return o.isMobile ? "lite" : "full";
}
