"use client";
import { useEffect, useState } from "react";
import {
  BIRTH_PROFILE_EVENT,
  loadBirthProfile,
  type BirthProfile,
} from "@/lib/birth-profile";

export interface BirthProfileState {
  profile: BirthProfile | null;
  /**
   * 클라이언트에서 저장소를 실제로 한 번 읽었는지. 정적 export라 첫 렌더는 서버
   * HTML이고 그때는 저장소를 볼 수 없다. 서버와 클라이언트의 첫 렌더 결과가
   * 달라지면 하이드레이션 불일치가 나므로, `ready`가 true가 되기 전에는 어느
   * 쪽으로도 단정하지 않는 중립 UI를 그려야 한다.
   */
  ready: boolean;
}

/** 저장된 출생 정보를 구독한다. 같은 탭의 변경과 다른 탭의 변경 모두 반영된다. */
export function useBirthProfile(): BirthProfileState {
  const [profile, setProfile] = useState<BirthProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setProfile(loadBirthProfile());
    sync();
    setReady(true);

    window.addEventListener(BIRTH_PROFILE_EVENT, sync);
    // 다른 탭에서 입력/삭제한 경우.
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(BIRTH_PROFILE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { profile, ready };
}
