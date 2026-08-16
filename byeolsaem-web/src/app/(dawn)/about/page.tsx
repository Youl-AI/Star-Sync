import type { Metadata } from "next";
import Link from "next/link";
import { DawnDocument, DawnSection } from "@/components/dawn/Document";
import { alternatesFor } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "소개 | 별샘",
  description:
    "별샘은 태어난 순간의 실제 행성 배치를 계산해 읽어주는 점성술 서비스입니다. 무작위 카드가 아니라 천문 계산에서 출발합니다.",
  alternates: alternatesFor("/about"),
};

export default function AboutPage() {
  return (
    <DawnDocument
      chapter="I"
      title="별샘에 대하여"
      lead="무작위로 뽑은 카드가 아니라, 당신이 태어난 그 순간 하늘에 실제로 있었던 것에서 시작합니다."
    >
      <p>
        사람은 저마다 다른 하늘 아래에서 태어납니다. 같은 날 태어나도 몇 시간 차이로
        동쪽 지평선에 떠오르는 별자리가 달라지고, 그 차이가 천궁도 전체의 배치를 바꿉니다.
        별샘은 그 순간의 하늘을 다시 계산해 보여주는 곳입니다.
      </p>

      <DawnSection title="어떻게 계산하나요">
        <p>
          태어난 날짜와 시각, 그리고 장소를 좌표로 바꾼 뒤 그 시점의 태양·달·행성 위치를
          천문력으로 계산합니다. 별자리와 하우스, 행성 사이의 각도가 모두 이 계산에서
          나옵니다. 어느 단계에서도 임의로 고르거나 뽑는 과정이 없습니다.
        </p>
        <p>
          태어난 시각을 모르면 하우스와 상승궁은 정할 수 없습니다. 그럴 때는 그 부분을
          비워 두고, 시각과 무관하게 정해지는 것만 알려 드립니다. 모르는 것을 아는 척하지
          않는 편이 낫다고 생각합니다.
        </p>
      </DawnSection>

      <DawnSection title="해석은 어디서 오나요">
        <p>
          계산된 배치마다 미리 작성해 둔 해석을 꺼내 맞춰 조립합니다. 같은 배치라면 언제
          다시 보아도 같은 이야기가 나옵니다. 어제와 오늘 말이 달라지는 풀이는 신뢰할
          수 없다고 보기 때문입니다.
        </p>
        <p>
          더 깊은 이야기를 원할 때만 인공지능이 개입합니다. 그 경우에는 화면에 분명히
          표시하고, 원하지 않으면 누르지 않으면 됩니다.
        </p>
      </DawnSection>

      <DawnSection title="점성술을 어떻게 대하고 있나요">
        <p>
          점성술은 미래를 알아맞히는 기술이 아닙니다. 태어난 순간의 하늘을 하나의 그림으로
          삼아 자신을 다른 각도에서 들여다보는 언어에 가깝습니다. 별샘은 그 언어를 가능한
          한 정확한 계산 위에 올려두려 합니다.
        </p>
        <p>
          그러니 여기서 읽은 것을 의학·법률·재무 판단의 근거로 삼지는 말아 주세요. 결정은
          언제나 당신의 것입니다.
        </p>
      </DawnSection>

      <DawnSection title="만드는 사람">
        <p>
          별샘은 한 사람이 만들고 있습니다. 이상한 점이나 틀린 계산을 발견하시면{" "}
          <a href="mailto:hayoul1999@gmail.com">hayoul1999@gmail.com</a>으로 알려 주세요.
          고쳐서 반영합니다.
        </p>
        <p>
          <Link href="/">밤하늘로 돌아가 내 천궁도를 보려면 여기를 누르세요.</Link>
        </p>
      </DawnSection>
    </DawnDocument>
  );
}
