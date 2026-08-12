import type { Metadata } from "next";
import { NatalReading } from "@/components/chart/NatalReading";

export const metadata: Metadata = {
  title: "나의 천궁도 | 별샘",
  description:
    "태어난 순간의 행성 배치를 계산해 읽어 드립니다. 태양과 달, 상승궁, 열 개의 별과 하우스, 그리고 별 사이의 각도까지.",
  // 저장된 출생 정보가 있어야 내용이 생기는 페이지다. 검색엔진이 보는 것은
  // "정보를 남겨 달라"는 안내뿐이므로 색인시키지 않는다. 얇은 페이지가 색인되면
  // 사이트 전체의 평가가 내려간다(RENEWAL_PLAN §2.4).
  robots: { index: false, follow: true },
};

export default function NatalPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pb-32 pt-28">
      <header className="text-center">
        <p className="font-latin text-eyebrow tracking-[0.28em] text-gold">NATAL CHART</p>
        <h1 className="mt-4 break-keep font-display text-3xl text-starlight md:text-4xl">
          나의 천궁도
        </h1>
        <p className="mx-auto mt-5 max-w-md break-keep leading-relaxed text-starlight-dim">
          태어난 순간 하늘에 실제로 있었던 것을 계산한 결과입니다. 계산도 풀이도 이
          브라우저 안에서 끝나며, 어디로도 전송되지 않습니다.
        </p>
      </header>

      <div className="mt-14">
        <NatalReading />
      </div>
    </main>
  );
}
