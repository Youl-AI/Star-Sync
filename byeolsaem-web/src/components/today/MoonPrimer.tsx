import { MOON_PHASE_LINES } from "@/content/atoms/today";
import { MOON_PHASES } from "@/lib/moon";
import { LineDiamond } from "@/components/ui/LineDiamond";

/**
 * 오늘의 카드 아래에 놓이는 읽을거리.
 *
 * 카드 자체는 브라우저가 그날 계산해 그리므로 HTML에는 껍데기만 남는다. 검색으로
 * 이 페이지에 닿은 사람과 크롤러가 보는 것이 그 껍데기였다 — 실측 122자
 * (2026-08-14). 그래서 날짜와 무관하게 언제나 참인 것들을 여기 적는다: 달이
 * 왜 매일 다른지, 여덟 위상이 각각 무엇인지, 트랜짓이라는 말이 무슨 뜻인지.
 *
 * 서버 컴포넌트다. 이 글은 아무 상태도 필요로 하지 않으므로 빌드된 HTML에
 * 그대로 들어간다.
 */
export function MoonPrimer() {
  return (
    <>
      <LineDiamond className="my-20" />

      <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
        <h2 className="break-keep font-display text-xl text-starlight">달은 왜 매일 다른가</h2>
        <p className="mt-5">
          달은 지구를 한 바퀴 도는 데 약 29.5일이 걸립니다. 그동안 태양·지구·달이
          이루는 각도가 계속 달라지고, 우리 눈에는 그 각도가 달의 밝은 면 크기로
          보입니다. 위상은 날씨처럼 변덕스러운 것이 아니라 이 각도 하나로 정해지는
          값이라, 어느 날의 달이 어떤 모양일지는 몇백 년 뒤까지 계산됩니다.
        </p>
        <p className="mt-4">
          달은 또 하루에 약 13도씩 별자리를 가로질러 이동합니다. 열두 자리를 두 달
          반이 아니라 <strong className="text-gold-soft">한 달 만에</strong> 다 지난다는
          뜻이고, 한 자리에 머무는 시간은 이틀 반쯤입니다. 이 페이지의 &lsquo;달
          처녀자리&rsquo; 같은 표기가 매일 바뀌는 이유가 여기 있습니다.
        </p>
        <p className="mt-4">
          같은 이유로 이 페이지의 값은 한국 시간 정오를 기준으로 계산합니다. 자정을
          쓰면 날짜가 바뀌는 그 순간의 하늘이 되어 사람들이 실제로 보내는 하루와
          어긋나고, 지금 시각을 쓰면 새로고침할 때마다 값이 조금씩 달라져 하루 동안
          같은 카드가 아니게 됩니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          여덟 위상, 그리고 각각의 자리
        </h2>
        <p className="mt-5">
          한 주기를 여덟 구간으로 나눠 부릅니다. 아래 문장은 그 구간에 붙은 오래된
          해석이고, 오늘 어느 구간인지는 위 카드가 계산해서 알려줍니다.
        </p>
        <dl className="mt-8 space-y-7">
          {MOON_PHASES.map((phase) => {
            const line = MOON_PHASE_LINES[phase.key];
            return (
              <div key={phase.key} className="border-t border-gold/12 pt-5">
                <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-lg text-starlight">{phase.ko}</span>
                  <span className="text-meta text-gold-soft">{line.title}</span>
                  <span className="text-meta text-starlight-dim">{phase.label}</span>
                </dt>
                <dd className="mt-2 break-keep text-starlight-dim">{line.line}</dd>
              </div>
            );
          })}
        </dl>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          &lsquo;오늘 하늘이 나를 건드린다&rsquo;는 말
        </h2>
        <p className="mt-5">
          점성술에서 트랜짓은 지금 하늘에 있는 별이 태어난 순간의 내 별과 특정한
          각도를 이루는 일을 말합니다. 태어난 순간의 배치는 평생 그 자리에 있고, 그
          위를 오늘의 별들이 지나갑니다. 두 위치가 0도·60도·90도·120도·180도에
          가까워질 때 그 자리가 건드려진다고 봅니다.
        </p>
        <p className="mt-4">
          그래서 트랜짓에는 유효 기간이 있습니다. 달이 만드는 각도는 반나절이면
          지나가고, 태양과 수성은 이삼 일, 화성은 일주일, 목성은 몇 주, 토성은 몇
          달을 갑니다. 위 카드가 항목마다 기간을 함께 적는 것은 이 차이가 그 항목의
          무게이기 때문입니다.
        </p>
        <p className="mt-4">
          여기까지는 태어난 순간을 알아야 나오는 이야기입니다. 달의 위상과 달이 든
          자리는 그날 하늘을 보는 모든 사람에게 같으므로, 출생 정보 없이도 위 카드의
          앞면은 읽을 수 있습니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          여기 숫자는 어디서 오는가
        </h2>
        <p className="mt-5">
          가져오지 않았습니다. 태양과 달, 행성의 위치를 궤도 요소에서 직접 계산하고,
          그 값으로 위상과 각도를 구합니다. 어느 단계에서도 무작위로 고르거나 뽑는
          과정이 없어서, 같은 날 같은 출생 정보라면 몇 번을 열어도 같은 글이
          나옵니다. 어제와 오늘 말이 달라지는 풀이는 믿을 수 없다고 보기 때문입니다.
        </p>
      </article>
    </>
  );
}
