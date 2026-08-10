import { scrollToId } from "./scroll";

/**
 * "히어로의 입력 의식을 열어달라"는 요청. 페이지 아래쪽 섹션(세 개의 문 등)이
 * 자기만의 입력 폼을 만드는 대신 이 이벤트를 쏘고, 히어로가 받아서 연다.
 * 입력 지점을 사이트 전체에서 히어로 하나로 유지하기 위한 장치다.
 */
export const OPEN_RITUAL_EVENT = "byeolsaem:open-ritual";

/** 히어로까지 스크롤한 뒤 입력 의식을 연다. */
export function requestRitual(): void {
  scrollToId("hero", () => {
    window.dispatchEvent(new Event(OPEN_RITUAL_EVENT));
  });
}
