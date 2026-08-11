/**
 * 진(陣)과 상세 페이지 사이의 모프에서 양쪽이 공유해야 하는 좌표.
 *
 * 모프는 두 개의 다른 라우트에 걸쳐 일어난다. `/sign`이 성좌를 화면 한가운데로
 * 날려 카드로 응결시키고, 그 다음 `/sign/<별자리>`가 같은 자리에서 카드를 받아
 * 제자리로 올려보낸다. 두 페이지가 "화면 한가운데의 카드"를 똑같은 크기·형태로
 * 그리지 않으면 그 순간 카드가 튄다.
 *
 * 그래서 ArchCard의 내부 치수를 여기 한 번만 적고 양쪽이 읽는다. ArchCard의
 * 여백을 고치면 이 값도 함께 고쳐야 한다 — 그 사실을 눈에 띄게 하려고 계산
 * 과정을 그대로 남겨 둔다.
 */

/**
 * 상세 페이지가 쓰는 ArchCard의 폭. 진 위의 성좌보다 눈에 띄게 커야 한다 —
 * 응결은 "커지면서 굳는" 동작이라 크기가 그대로면 자리만 옮긴 것으로 보인다.
 * 화면 폭 360px에서도 좌우 여백(px-6) 안에 들어간다.
 */
export const CARD_WIDTH = 256;
/** ArchCard는 폭의 1.5배 높이다. */
export const CARD_HEIGHT = CARD_WIDTH * 1.5;

/** 카드 안 성좌 그림의 폭. */
export const ART_WIDTH = 196;
/** 성좌 viewBox는 260×200이다. */
export const ART_HEIGHT = (ART_WIDTH * 200) / 260;

/** 카드 왼쪽 모서리에서 성좌 그림까지. mx-auto이므로 남는 폭의 절반. */
export const ART_OFFSET_X = (CARD_WIDTH - ART_WIDTH) / 2;
/** 카드 위쪽 모서리에서 성좌 그림까지. p-[7px] + pt-8 + mt-3. */
export const ART_OFFSET_Y = 7 + 32 + 12;

/**
 * 아치 테두리의 윤곽. 위는 반원, 아래는 각진 상자 — ArchCard의 border-radius가
 * 만드는 형태를 선 하나로 옮긴 것이다. 응결 순간 이 선이 그려지며 성좌를 감싼다.
 */
export function archPath(w = CARD_WIDTH, h = CARD_HEIGHT) {
  const r = w / 2;
  return `M 0 ${h} L 0 ${r} A ${r} ${r} 0 0 1 ${w} ${r} L ${w} ${h} Z`;
}

/**
 * 되돌아올 성좌의 표식. 진이 **날려 보내면서** 남기고, 진이 다시 열릴 때 읽고
 * 지운다. sessionStorage인 이유는 탭 안에서만 유효해야 하고, 두 라우트가 서로
 * 다른 React 트리라 메모리로는 넘길 수 없기 때문이다.
 *
 * 처음에는 상세 페이지가 popstate를 듣고 남기게 했는데 표식이 한 번도 써지지
 * 않았다(실측). 뒤로가기가 일어나면 라우터가 먼저 popstate를 받아 상세 페이지를
 * 그 자리에서 언마운트하고, 그 과정에서 우리 리스너가 목록에서 제거된다 — DOM
 * 명세상 발송 중에 제거된 리스너는 호출되지 않는다. 떠나는 순간을 붙잡으려 하지
 * 않고 떠나기 전에 미리 적어 두는 편이 확실하다.
 */
export const BACK_MORPH_KEY = "byeolsaem.sign.back";

/**
 * 모프로 상세 페이지에 도착했다는 표식. 진이 남기고, 상세 페이지가 읽고 지운다.
 * 이게 없으면(검색으로 직접 착지, 새로고침) 상세 페이지는 아무 연출 없이 그냥
 * 완성된 화면으로 뜬다 — 스펙 §6.4가 요구하는 동작이다.
 */
export const ARRIVE_MORPH_KEY = "byeolsaem.sign.arrive";

/** 표식을 읽고 즉시 지운다. 한 번의 이동에 한 번만 연출되어야 한다. */
export function takeMarker(key: string): string | null {
  try {
    const value = sessionStorage.getItem(key);
    if (value) sessionStorage.removeItem(key);
    return value;
  } catch {
    // 사파리 프라이빗 모드 등에서 sessionStorage 접근이 던진다. 표식이 없는
    // 것으로 보고 연출만 건너뛴다 — 이동 자체는 막지 않는다.
    return null;
  }
}

export function setMarker(key: string, value: string) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* 위와 같음 */
  }
}

export function clearMarker(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* 위와 같음 */
  }
}
