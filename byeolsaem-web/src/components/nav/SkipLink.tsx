/**
 * 본문으로 건너뛰기.
 *
 * 키보드만 쓰는 사람은 Tab을 누를 때마다 머리글의 링크를 하나씩 지나야 본문에
 * 닿는다. 페이지가 스무 장을 넘은 지금은 그 앞머리가 늘 같은 자리에서 반복된다.
 * 그래서 문서의 가장 첫 초점 자리에 이 링크 하나를 둔다 — 평소에는 화면 위로
 * 밀어 두었다가 초점을 받는 순간 내려온다.
 *
 * axe는 이것을 위반으로 잡지 않는다(권고 수준)라서 자동 감사로는 영영 나오지
 * 않는 자리다. 두 세계(밤·새벽) 어디에도 걸치므로 최상위 레이아웃이 갖는다.
 *
 * 색은 먹빛 칩으로 고정한다. 밝은 새벽 문서 위에서도, 어두운 밤 페이지 위에서도
 * 같은 칩이 또렷하게 읽힌다 — 세계마다 다른 색을 쓰면 이 한 줄을 위해 레이아웃
 * 지식을 여기까지 끌고 와야 한다.
 */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="fixed left-6 top-4 z-50 -translate-y-24 border border-gold/50 bg-ink-raised px-4 py-2 text-sm text-starlight transition-transform duration-200 ease-out focus:translate-y-0 motion-reduce:transition-none"
    >
      본문으로 건너뛰기
    </a>
  );
}
