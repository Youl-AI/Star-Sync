import { SYNASTRY_ASPECTS, PLANET_TOUCH } from "@/content/atoms/synastry";
import { ASPECT_TYPES } from "@/lib/chart";
import { PLANETS } from "@/lib/planets";
import { AspectBadge } from "@/components/ui/AspectBadge";
import { LineDiamond } from "@/components/ui/LineDiamond";

/**
 * 궁합 아래에 놓이는 읽을거리.
 *
 * 상대의 정보를 넣기 전까지 이 페이지는 안내 문구뿐이다(실측 112자, 2026-08-14).
 * NatalPrimer와 같은 이유로, 누구의 궁합인지와 무관하게 참인 것을 적는다 —
 * 각도 다섯 가지가 각각 어떤 사이인지, 어느 자리가 만나는지, 그리고 왜 이
 * 페이지가 점수를 내지 않는지.
 */
export function SynastryPrimer() {
  return (
    <>
      <LineDiamond className="my-20" />

      <article className="mx-auto max-w-[65ch] leading-[1.9] text-starlight">
        <h2 className="break-keep font-display text-xl text-starlight">
          두 하늘을 겹쳐 본다는 것
        </h2>
        <p className="mt-5">
          궁합(시나스트리)은 두 사람의 천궁도를 나란히 놓고, 한쪽의 별이 다른 쪽의
          별과 어떤 각도를 이루는지 보는 방법입니다. 내 금성이 상대의 화성과 120도를
          맺는다면, 내가 좋아하는 방식과 상대가 밀어붙이는 방식이 서로 통한다는
          뜻으로 읽습니다.
        </p>
        <p className="mt-4">
          각도는 <strong className="text-gold-soft">두 힘이 어떤 사이인지</strong>만
          말합니다. 그것이 삶의 어느 영역에서 벌어지는지는 각도가 아니라 방(하우스)이
          말합니다 — 상대의 별이 내 어느 방에 들어오는지를 함께 봐야 &ldquo;그 사람과
          돈&rdquo; 같은 물음에 답이 됩니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          다섯 가지 각도
        </h2>
        <p className="mt-5">
          두 별 사이의 거리가 아래 각도에 가까울 때 서로를 건드린다고 봅니다. 좋고
          나쁨이 아니라 사이의 종류입니다.
        </p>
        <dl className="mt-8 space-y-6">
          {Object.entries(SYNASTRY_ASPECTS).map(([key, meaning]) => {
            // 각의 기하 인장 — 각도는 본질이 기하인데 글로만 적혀 있었다(감사 2026-08-28).
            const type = ASPECT_TYPES.find((t) => t.key === key);
            return (
              <div key={key} className="flex gap-5 border-t border-gold/12 pt-5">
                {type && (
                  <AspectBadge
                    angle={type.angle}
                    harmony={type.harmony}
                    className="mt-1 w-16 flex-none max-sm:hidden"
                  />
                )}
                <div>
                  <dt className="font-display text-lg text-starlight">
                    {meaning.headline}
                    {type && (
                      <span className="ml-3 text-meta font-normal text-starlight-dim">
                        {type.ko} {type.angle}도
                      </span>
                    )}
                  </dt>
                  <dd className="mt-2 break-keep text-starlight-dim">{meaning.body}</dd>
                </div>
              </div>
            );
          })}
        </dl>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          어느 자리가 만나는가
        </h2>
        <p className="mt-5">
          같은 각도라도 어느 별끼리 맺느냐에 따라 이야기가 달라집니다. 별마다 관계에서
          맡는 자리가 있습니다.
        </p>
        <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
          {PLANETS.map((planet) => (
            <li key={planet.key} className="flex items-baseline gap-2">
              <span className="astro-symbol flex-none text-gold-soft" aria-hidden>
                {planet.symbol}
                {"︎"}
              </span>
              <span className="text-starlight">{planet.ko}</span>
              <span className="break-keep text-meta text-starlight-dim">
                — {PLANET_TOUCH[planet.key]}
              </span>
            </li>
          ))}
        </ul>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          점수를 내지 않는 이유
        </h2>
        <p className="mt-5">
          낼 수 없기 때문입니다. 두 사람이 잘 지낼지는 하늘이 정하지 않습니다. 하늘이
          말해 주는 것은 두 사람이 서로의 어디를 건드리는가까지이고, 그 다음은 두
          사람의 몫입니다.
        </p>
        <p className="mt-4">
          그래서 이 페이지가 앞에 세우는 숫자는 궁합 점수가 아니라, 오래전부터 이름이
          붙어 온 열두 조합 가운데 실제로 각도로 맺혀 있는 것이 몇 개인지를 센 값입니다.
          많다고 좋은 관계라는 뜻이 아니라 서로 걸리는 자리가 많다는 뜻이고, 적다고
          나쁜 것이 아니라 서로를 덜 흔든다는 뜻입니다. 아래 목록에서 직접 세어 보면
          같은 값이 나옵니다.
        </p>

        <h2 className="mt-14 break-keep font-display text-xl text-starlight">
          상대의 정보는 남지 않습니다
        </h2>
        <p className="mt-5">
          내 출생 정보는 이 브라우저에 저장되지만 상대의 것은 저장하지 않습니다. 이
          화면을 떠나거나 새로고침하면 사라집니다 — 남의 생년월일을 내 브라우저에
          남길 이유가 없습니다. 계산도 이 브라우저 안에서 끝나므로 어느 쪽 정보도
          서버로 가지 않습니다.
        </p>
      </article>
    </>
  );
}
