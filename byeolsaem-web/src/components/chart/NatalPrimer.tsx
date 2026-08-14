import { HOUSES } from "@/content/atoms/houses";
import { LineDiamond } from "@/components/ui/LineDiamond";

/**
 * 천궁도 아래에 놓이는 읽을거리.
 *
 * 이 페이지는 저장된 출생 정보가 있어야 내용이 생긴다. 정보를 남기지 않은 사람과
 * 크롤러가 받는 HTML은 안내 문구뿐이었다(실측 112자, 2026-08-14). 색인은 원래
 * 막아 두었지만 광고가 실리는 페이지가 되었으므로, 사람이 열었을 때 읽을 것이
 * 있어야 한다.
 *
 * 여기 적는 것은 누구의 차트인지와 무관하게 참인 것들이다 — 천궁도가 무엇으로
 * 이루어져 있는지, 왜 태어난 시각이 필요한지, 열두 하우스가 각각 삶의 어느
 * 영역인지.
 */
export function NatalPrimer() {
  return (
    <>
      <LineDiamond className="my-20" />

      <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
        <h2 className="break-keep font-display text-xl text-starlight">천궁도는 무엇으로 되어 있나</h2>
        <p className="mt-5">
          천궁도는 태어난 순간, 태어난 장소에서 올려다본 하늘의 지도입니다. 세 가지가
          겹쳐 한 장을 이룹니다 — 열 개의 별이 <strong className="text-gold-soft">어느
          별자리에</strong> 있었는지, 그 별들이 <strong className="text-gold-soft">삶의
          어느 방에</strong> 놓였는지, 그리고 별끼리 <strong className="text-gold-soft">
          어떤 각도로</strong> 마주 보는지.
        </p>
        <p className="mt-4">
          별자리는 방식을 정합니다. 같은 화성이라도 양자리에 있으면 곧바로 부딪히고
          염소자리에 있으면 계획으로 밉니다. 하우스는 장소를 정합니다. 그 화성이 2하우스에
          있으면 돈을 버는 자리에서, 9하우스에 있으면 배우고 멀리 가는 자리에서 힘을
          씁니다. 각도는 그 힘이 다른 힘과 어떻게 얽히는지를 정합니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          먼저 볼 것은 셋뿐입니다
        </h2>
        <p className="mt-5">
          열 개의 별을 한 번에 외울 필요는 없습니다. 뼈대는 셋입니다.
        </p>
        <ul className="mt-6 space-y-4">
          <li>
            <strong className="text-gold-soft">태양</strong> — 무엇을 향해 가는
            사람인가. 삶에서 무엇을 증명하려 하는지가 여기 있습니다.
          </li>
          <li>
            <strong className="text-gold-soft">달</strong> — 혼자 있을 때 어떤
            사람인가. 무엇에 안심하고 무엇에 불안해지는지를 말합니다.
          </li>
          <li>
            <strong className="text-gold-soft">상승궁</strong> — 남들이 처음 보는 나.
            태어난 순간 동쪽 지평선에 떠오르던 별자리입니다.
          </li>
        </ul>
        <p className="mt-6">
          이 셋이 서로 다른 방향을 가리키는 일은 흔합니다. 겉으로는 거침없는데 혼자
          있을 때는 한없이 점검하는 사람, 조용해 보이는데 안에서는 늘 달리는 사람.
          그 간격이 결함이 아니라 그 사람을 움직이는 힘입니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          태어난 시각이 필요한 이유
        </h2>
        <p className="mt-5">
          별자리는 날짜만 알면 정해지지만 상승궁과 하우스는 그렇지 않습니다. 지구가
          하루에 한 바퀴 자전하므로 상승궁은 약 2시간마다 한 자리씩 옮겨 가고, 그에
          따라 열두 방의 경계가 통째로 돌아갑니다. 시각이 4분 어긋나면 상승궁이 1도
          움직입니다.
        </p>
        <p className="mt-4">
          시각을 모르면 별샘은 그 부분을 비워 둡니다. 그럴듯한 값을 채워 넣는 대신
          시각과 무관하게 정해지는 것만 알려 드립니다. 달도 하루에 13도를 움직이므로,
          시각 없이 계산한 달의 자리는 정오를 기준으로 한 값입니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          열두 개의 방
        </h2>
        <p className="mt-5">
          하우스는 하늘을 열둘로 나눈 삶의 영역입니다. 별이 어느 방에 들었는지가 그
          힘이 실제로 쓰이는 자리를 정합니다.
        </p>
        <dl className="mt-8 space-y-6">
          {HOUSES.map((house) => (
            <div key={house.number} className="border-t border-gold/12 pt-5">
              <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg text-starlight">
                  {house.number}. {house.ko}
                </span>
                <span className="text-meta text-starlight-dim">{house.domain}</span>
              </dt>
              <dd className="mt-2 break-keep text-starlight-dim">{house.body}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          이 계산은 어디서 이루어지나
        </h2>
        <p className="mt-5">
          이 브라우저 안에서입니다. 태어난 날짜와 시각, 장소의 좌표로 그 순간의 행성
          위치를 천문력으로 구하고, 거기에 미리 작성해 둔 해석을 붙여 조립합니다.
          출생 정보는 어디로도 전송되지 않고, 같은 정보를 넣으면 언제 다시 열어도
          같은 글이 나옵니다. 어제와 오늘 말이 달라지는 풀이는 믿을 수 없다고 보기
          때문입니다.
        </p>
      </article>
    </>
  );
}
