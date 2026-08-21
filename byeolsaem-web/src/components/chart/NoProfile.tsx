"use client";
import { GoldButton } from "@/components/ui/GoldButton";
import { requestRitual } from "@/lib/ritual";

/*
 * 예전에는 여기에 NoProfile("…을 보려면 태어난 순간이 필요합니다")이 있었다.
 * 정보 없는 화면이 요구부터 하는 구조였고, 지금은 두 소비자 모두 예시 결과를
 * 먼저 보여준다 — /natal은 ExampleSky, /synastry는 ExampleMeeting.
 */

/** 저장된 지역명에서 좌표를 찾지 못했을 때. */
export function UnknownPlace({ city }: { city: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="break-keep leading-relaxed text-starlight">
        &lsquo;{city}&rsquo;의 좌표를 찾지 못했습니다.
      </p>
      <p className="mt-3 break-keep text-guide text-starlight-dim">
        상승궁과 하우스는 태어난 곳의 위도와 경도로 구합니다. 좌표를 모르는 채로
        그럴듯한 값을 채워 넣지는 않습니다.
      </p>
      <div className="mt-8 flex justify-center">
        <GoldButton variant="outline" onClick={() => requestRitual()}>
          태어난 곳 다시 고르기
        </GoldButton>
      </div>
    </div>
  );
}

/** 저장소를 아직 읽기 전. 서버가 만든 HTML과 같은 자리를 차지해야 한다. */
export function ChartLoading() {
  return (
    <div className="py-16 text-center text-guide text-starlight-dim" aria-live="polite">
      하늘을 여는 중입니다.
    </div>
  );
}
