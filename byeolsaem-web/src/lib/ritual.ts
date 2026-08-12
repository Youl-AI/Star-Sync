import type { RitualData } from "@/components/hero/RitualForm";
import { scrollToId } from "./scroll";

/**
 * "히어로의 입력 의식을 열어달라"는 요청. 페이지 아래쪽 섹션(세 개의 문 등)이
 * 자기만의 입력 폼을 만드는 대신 이 이벤트를 쏘고, 히어로가 받아서 연다.
 * 입력 지점을 사이트 전체에서 히어로 하나로 유지하기 위한 장치다.
 */
export const OPEN_RITUAL_EVENT = "byeolsaem:open-ritual";

/** 히어로가 없는 페이지에서 같은 의식을 패널로 여는 요청. BirthPanel이 받는다. */
export const OPEN_BIRTH_PANEL_EVENT = "byeolsaem:open-birth-panel";

export interface BirthPanelRequest {
  /** 패널 제목. 기본은 내 출생 정보를 받는 경우다. */
  title?: string;
  /** 제목 위 라틴 머리표. */
  kicker?: string;
  /** 제목 아래 한 줄. 왜 이걸 묻는지 설명해야 하는 경우에만. */
  description?: string;
  /**
   * 다 받았을 때 할 일. 넘기지 않으면 내 출생 정보로 저장한다.
   * `/synastry`의 상대방 정보처럼 다른 곳에 담아야 할 때 쓴다.
   */
  onComplete?: (data: RitualData) => void;
}

/**
 * 출생 정보를 받는다. 어디서 부르든 맞는 방식으로 열린다.
 *
 * 메인에는 히어로의 3장면 연출이 있고 그것이 처음 오는 사람의 첫인상이므로
 * 그대로 쓴다. 히어로가 없는 페이지(`/natal` 등)에서는 패널로 연다 — 예전에는
 * 메인으로 링크를 걸어 돌려보냈고, 그러면 보던 것이 사라졌다(RENEWAL_PLAN §11.4).
 */
export function requestRitual(request: BirthPanelRequest = {}): void {
  if (document.getElementById("hero")) {
    scrollToId("hero", () => {
      window.dispatchEvent(new Event(OPEN_RITUAL_EVENT));
    });
    return;
  }
  openBirthPanel(request);
}

/** 히어로가 있어도 패널로 연다. 상대방 정보처럼 히어로가 다룰 수 없는 경우. */
export function openBirthPanel(request: BirthPanelRequest = {}): void {
  window.dispatchEvent(
    new CustomEvent<BirthPanelRequest>(OPEN_BIRTH_PANEL_EVENT, { detail: request }),
  );
}
