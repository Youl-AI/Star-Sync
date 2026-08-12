/**
 * 앞말의 받침에 따라 조사를 고른다.
 *
 * 조립한 문장은 어느 낱말이 앞에 올지 미리 알 수 없다. "자리와 방식", "방식과
 * 자리" — 두 경우가 다 나온다. '와(과)'로 도망가면 읽는 사람이 매번 괄호를
 * 건너뛰어야 하고, 그 순간 문장이 사람이 쓴 것이 아니라 기계가 이어 붙인 것으로
 * 읽힌다. 이 사이트의 글은 그 반대를 노린다.
 *
 * 한글 음절의 유니코드는 (초성, 중성, 종성)을 28진법으로 쌓아 만든다. 종성이
 * 없는 음절은 그 나머지가 0이므로 받침 여부는 나눗셈 한 번이면 나온다.
 */

function hasFinalConsonant(word: string): boolean | null {
  const code = word.charCodeAt(word.length - 1);
  if (Number.isNaN(code) || code < 0xac00 || code > 0xd7a3) return null;
  return (code - 0xac00) % 28 !== 0;
}

/** 한글이 아니면 받침이 있는 쪽으로 적는다 — 숫자와 라틴 표기가 대개 그렇다. */
function pick(word: string, withFinal: string, withoutFinal: string): string {
  return hasFinalConsonant(word) === false ? withoutFinal : withFinal;
}

/** 과 / 와 */
export function gwa(word: string): string {
  return pick(word, "과", "와");
}

/** 이 / 가 */
export function iga(word: string): string {
  return pick(word, "이", "가");
}

/** 을 / 를 */
export function eul(word: string): string {
  return pick(word, "을", "를");
}

/** 은 / 는 */
export function eun(word: string): string {
  return pick(word, "은", "는");
}
