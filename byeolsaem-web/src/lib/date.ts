// 연간 운세가 다루는 "해"를 계산한다. 11월부터는 다음 해의 운세를 미리
// 보여주는 것이 자연스러우므로(백엔드 get_fortune_year()와 동일한 규칙),
// 11월(month index 10, 0-based)부터는 다음 해를 반환한다.
export function getFortuneYear(now: Date): number {
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based: 10 = 11월, 11 = 12월
  return month >= 10 ? year + 1 : year;
}
