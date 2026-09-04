"use client";
import { GoldButton } from "@/components/ui/GoldButton";
import { requestRitual } from "@/lib/ritual";

/**
 * 예시 하늘의 단추 둘.
 *
 * ExampleSky 본문은 서버에서 그려져 HTML에 남는다(그쪽 주석 참고). 단추만
 * 누를 수 있어야 하므로 이 조각만 클라이언트로 떼어 냈다.
 */
export function ExampleCta({ label }: { label: string }) {
  return (
    <GoldButton variant="solid" onClick={() => requestRitual()}>
      {label}
    </GoldButton>
  );
}
