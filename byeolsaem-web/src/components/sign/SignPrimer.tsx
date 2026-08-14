import { ZODIAC_SIGNS } from "@/lib/zodiac";
import { LineDiamond } from "@/components/ui/LineDiamond";

/**
 * 열두 방 목록 아래에 놓이는 읽을거리.
 *
 * 이 페이지는 진(陣)과 링크 열두 개가 전부라 크롤러가 읽는 글자가 184자였다
 * (2026-08-14 실측). 검색으로 &lsquo;별자리&rsquo;를 찾아 들어온 사람에게도 목록만
 * 내미는 셈이라, 열두 자리를 읽는 데 필요한 뼈대를 여기 적는다.
 *
 * 자리마다 다른 이야기는 상세 페이지가 맡는다. 여기서는 열둘 전체를 가로지르는
 * 것 — 원소와 특질, 그리고 태양궁이 무엇이고 무엇이 아닌지 — 만 다룬다.
 *
 * data-morph-fade: 성좌가 카드로 날아가는 동안 이 영역도 함께 지워져야 한다
 * (Astrolabe 타이밍 주석 참고).
 */

const ELEMENTS = [
  {
    name: "불",
    signs: "양자리 · 사자자리 · 궁수자리",
    body:
      "먼저 움직이고 나서 생각합니다. 방향을 만들고 자리를 데우는 쪽이라, 시작하는 일과 나서는 일에서 자연스럽습니다. 대신 오래 지키는 일에서는 인내가 먼저 바닥납니다.",
  },
  {
    name: "흙",
    signs: "황소자리 · 처녀자리 · 염소자리",
    body:
      "손에 잡히는 것으로 판단합니다. 쌓고 다듬고 굴러가게 만드는 자리라 결과가 남습니다. 대신 눈에 보이지 않는 가능성 앞에서는 좀처럼 움직이지 않습니다.",
  },
  {
    name: "공기",
    signs: "쌍둥이자리 · 천칭자리 · 물병자리",
    body:
      "말과 생각으로 세상을 다룹니다. 잇고 견주고 다시 정의하는 자리라 관계와 아이디어에서 강합니다. 대신 감정을 몸으로 겪기보다 한 발 떨어져 관찰합니다.",
  },
  {
    name: "물",
    signs: "게자리 · 전갈자리 · 물고기자리",
    body:
      "느낌으로 먼저 압니다. 남의 상태를 빠르게 알아차리고 오래 기억하는 자리라 깊은 관계에서 강합니다. 대신 자기 것과 남의 것을 가르는 선이 흐려지기 쉽습니다.",
  },
];

const QUALITIES = [
  {
    name: "활동",
    signs: "양자리 · 게자리 · 천칭자리 · 염소자리",
    body: "계절이 시작되는 자리입니다. 판을 여는 힘이 있고, 멈춰 있는 상태를 견디지 못합니다.",
  },
  {
    name: "고정",
    signs: "황소자리 · 사자자리 · 전갈자리 · 물병자리",
    body: "계절이 무르익는 자리입니다. 지키고 버티는 힘이 있고, 방향을 바꾸는 데 시간이 걸립니다.",
  },
  {
    name: "변통",
    signs: "쌍둥이자리 · 처녀자리 · 궁수자리 · 물고기자리",
    body: "계절이 넘어가는 자리입니다. 맞춰 가는 힘이 있고, 한 자리에 고정되면 답답해합니다.",
  },
];

export function SignPrimer() {
  return (
    <div data-morph-fade>
      <LineDiamond className="my-20" />

      <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
        <h2 className="break-keep font-display text-xl text-starlight">
          태양궁이 말하는 것, 말하지 않는 것
        </h2>
        <p className="mt-5">
          흔히 &lsquo;별자리&rsquo;라고 부르는 것은 태어난 날 태양이 있던 자리입니다.
          태양은 한 해에 걸쳐 황도를 한 바퀴 돌고, 한 자리에 약 한 달 머뭅니다.
          그래서 날짜만 알면 정해지고, 같은 기간에 태어난 사람은 모두 같은 값을
          갖습니다.
        </p>
        <p className="mt-4">
          태양궁이 말해 주는 것은{" "}
          <strong className="text-gold-soft">무엇을 향해 가는 사람인가</strong>입니다.
          삶에서 무엇을 증명하려 하는지, 어떤 방식으로 자기를 세우는지가 여기 있습니다.
        </p>
        <p className="mt-4">
          말해 주지 않는 것도 분명합니다. 혼자 있을 때 어떤 사람인지는 달이, 남들이
          처음 보는 인상은 상승궁이, 그 힘이 삶의 어느 영역에서 쓰이는지는 하우스가
          정합니다. 상승궁과 하우스는 태어난 시각을 알아야 나오고, 시각이 두 시간
          어긋나면 열두 방이 통째로 한 칸 돌아갑니다. &lsquo;내 별자리 운세가 잘 안
          맞는다&rsquo;고 느끼는 경우의 상당수가 여기서 옵니다 — 틀린 것이 아니라
          한 조각만 본 것입니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          네 가지 원소 — 무엇으로 세상을 다루는가
        </h2>
        <p className="mt-5">
          열두 자리는 네 원소로 묶입니다. 같은 원소끼리는 세상을 받아들이는 방식이
          닮았고, 서로를 설명 없이 알아듣습니다.
        </p>
        <dl className="mt-8 space-y-6">
          {ELEMENTS.map((e) => (
            <div key={e.name} className="border-t border-gold/12 pt-5">
              <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg text-starlight">{e.name}</span>
                <span className="text-meta text-starlight-dim">{e.signs}</span>
              </dt>
              <dd className="mt-2 break-keep text-starlight-dim">{e.body}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          세 가지 특질 — 계절의 어느 지점인가
        </h2>
        <p className="mt-5">
          원소가 &lsquo;무엇으로&rsquo;라면 특질은 &lsquo;어느 국면에서&rsquo;입니다.
          각 계절의 처음·한가운데·끝에 해당하는 자리들이 각각 하나씩 묶입니다.
        </p>
        <dl className="mt-8 space-y-6">
          {QUALITIES.map((q) => (
            <div key={q.name} className="border-t border-gold/12 pt-5">
              <dt className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-display text-lg text-starlight">{q.name}</span>
                <span className="text-meta text-starlight-dim">{q.signs}</span>
              </dt>
              <dd className="mt-2 break-keep text-starlight-dim">{q.body}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 break-keep text-guide text-starlight-dim">
          원소 넷과 특질 셋을 곱하면 정확히 열둘이 됩니다. 같은 조합을 가진 자리가
          둘일 수 없다는 뜻이고, 열두 자리가 저마다 다른 이유이기도 합니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">열둘의 표</h2>
        <p className="mt-5">
          기간은 해마다 하루쯤 움직입니다. 태양이 자리를 옮기는 순간이 날짜 경계와
          정확히 맞아떨어지지 않기 때문이라, 경계에 태어났다면 태어난 해의 실제
          위치를 계산해 보는 편이 정확합니다.
        </p>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[34rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-gold/25 text-meta tracking-[0.14em] text-gold">
                <th scope="col" className="py-2.5 pr-4 font-normal">자리</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">기간</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">원소</th>
                <th scope="col" className="py-2.5 pr-4 font-normal">특질</th>
                <th scope="col" className="py-2.5 font-normal">지배 행성</th>
              </tr>
            </thead>
            <tbody>
              {ZODIAC_SIGNS.map((s) => (
                <tr key={s.key} className="border-b border-gold/10">
                  <th scope="row" className="py-2.5 pr-4 font-display text-base font-normal text-starlight">
                    {s.ko}
                  </th>
                  <td className="py-2.5 pr-4 tabular-nums text-starlight-dim">{s.range}</td>
                  <td className="py-2.5 pr-4 text-starlight-dim">{s.element}</td>
                  <td className="py-2.5 pr-4 text-starlight-dim">{s.quality}</td>
                  <td className="py-2.5 text-starlight-dim">{s.ruler}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          순서에는 이유가 있습니다
        </h2>
        <p className="mt-5">
          양자리가 첫 자리인 것은 춘분에서 시작하기 때문입니다. 낮이 밤을 넘어서는
          지점이라, 아무것도 정해지지 않은 상태에서 먼저 움직이는 성질이 여기 놓입니다.
          이어지는 자리들은 계절을 따라갑니다 — 쌓고(황소), 잇고(쌍둥이), 들이고(게),
          내놓고(사자), 다듬는(처녀) 순서로 &lsquo;나&rsquo;가 만들어집니다.
        </p>
        <p className="mt-4">
          천칭자리는 추분, 황도의 정확히 절반입니다. 여기서부터 &lsquo;너&rsquo;가
          등장하고, 관계와 공유와 확장을 거쳐 마지막 물고기자리에서 경계가 흐려지며
          한 바퀴가 닫힙니다. 열두 자리를 따로 외우기보다 이 흐름으로 읽으면 각 자리가
          왜 그런 성질을 갖는지가 훨씬 잘 보입니다.
        </p>
      </article>
    </div>
  );
}
