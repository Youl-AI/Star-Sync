import Link from "next/link";
import { GoldButton } from "@/components/ui/GoldButton";

/**
 * 출생 정보가 없는 사람이 도구 페이지에 바로 들어왔을 때.
 *
 * 정보는 메인의 의식에서 한 번만 받는다. 여기서 또 폼을 세우면 같은 것을 두 곳에서
 * 관리하게 되고, 두 곳의 검증이 어긋나는 순간부터는 어느 쪽이 맞는지 알 수 없다.
 */
export function NoProfile({ what }: { what: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="break-keep leading-relaxed text-starlight">
        {what}을(를) 보려면 태어난 순간이 필요합니다.
      </p>
      <p className="mt-3 break-keep text-sm leading-relaxed text-starlight-dim">
        날짜와 시각, 그리고 태어난 곳. 한 번만 남기면 이 사이트의 모든 페이지가 그
        하늘을 씁니다. 저장은 이 브라우저 안에서만 이뤄집니다.
      </p>
      <div className="mt-8 flex justify-center">
        <GoldButton variant="solid" href="/">
          내 하늘 열기
        </GoldButton>
      </div>
    </div>
  );
}

/** 저장된 지역명에서 좌표를 찾지 못했을 때. */
export function UnknownPlace({ city }: { city: string }) {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="break-keep leading-relaxed text-starlight">
        &lsquo;{city}&rsquo;의 좌표를 찾지 못했습니다.
      </p>
      <p className="mt-3 break-keep text-sm leading-relaxed text-starlight-dim">
        상승궁과 하우스는 태어난 곳의 위도와 경도로 구합니다. 좌표를 모르는 채로
        그럴듯한 값을 채워 넣지는 않습니다.{" "}
        <Link href="/" className="border-b border-gold/40 pb-0.5 text-gold-soft">
          출생 정보를 다시 남겨
        </Link>{" "}
        주세요.
      </p>
    </div>
  );
}

/** 저장소를 아직 읽기 전. 서버가 만든 HTML과 같은 자리를 차지해야 한다. */
export function ChartLoading() {
  return (
    <div className="py-16 text-center text-sm text-starlight-dim" aria-live="polite">
      하늘을 여는 중입니다.
    </div>
  );
}
