/**
 * 문장 단위 유틸.
 *
 * 이 저장소의 모든 해석 문장은 "…다."로 끝난다(아톰 작문 규칙, 스펙 §7).
 * 그래서 첫 "다."까지가 곧 첫 문장이다 — 평생의 과제(reading.ts)와 한 해의
 * headline(yearly-reading.ts)이 문단에서 첫 문장만 떼어 쓸 때 이 규칙에 기댄다.
 * atoms.test.ts가 규칙 쪽을 지킨다.
 */
export function firstSentence(text: string): string {
  const end = text.indexOf("다.");
  return end === -1 ? text : text.slice(0, end + 2);
}
