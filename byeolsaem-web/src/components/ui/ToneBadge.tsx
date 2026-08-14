/**
 * 강도 라벨 — 이 각도가 순풍인지 마찰인지 겹침인지를 글자로 말한다.
 *
 * 테두리 색(gold/40 vs gold/12)만으로는 아무도 못 읽는다는 가시성 점검
 * (2026-08-14)에서 나왔다. 캡슐 테두리는 두르지 않는다 — 본문 사이에서
 * 은은하게 읽히는 작은 글자면 충분하고, 그쪽이 이 사이트의 결이다.
 */
export function ToneBadge({ harmony, span }: { harmony: number; span?: string }) {
  const tone = harmony > 0 ? "순풍" : harmony < 0 ? "마찰" : "겹침";
  const color =
    harmony > 0 ? "text-[#b9d9ae]" : harmony < 0 ? "text-[#d9aeae]" : "text-gold-soft";
  return (
    <span className={`text-eyebrow tracking-[0.18em] ${color}`}>
      {tone}
      {span ? <span className="text-starlight-dim"> · {span}</span> : null}
    </span>
  );
}
