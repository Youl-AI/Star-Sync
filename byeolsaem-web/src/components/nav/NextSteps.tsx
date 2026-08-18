import { GoldButton } from "@/components/ui/GoldButton";

/**
 * 도구 페이지의 마무리 — 다 읽은 사람을 다음으로 보낸다.
 *
 * /sign/[sign]에는 이미 이런 블록이 있었는데 도구 네 곳에는 없었다. 그래서
 * `/today`·`/yearly`·`/synastry`는 본문 안에서 다른 곳으로 나가는 링크가 하나도
 * 없는 막다른 길이었다(실측). 4,700자를 읽고 나면 갈 데가 뒤로가기뿐이다.
 *
 * 일반 메뉴를 하나 더 붙이는 것이 아니라 **방금 읽은 것에서 자연스럽게 이어지는
 * 곳**만 건다. 무엇이 다음인지는 페이지마다 다르므로 부르는 쪽이 정한다.
 *
 * 서버에서 그려지는 정적 링크라 크롤러도 따라간다 — 색인된 페이지들이 서로
 * 떨어진 섬으로 남지 않게 하는 것이 이 블록의 절반이다.
 */
export function NextSteps({
  lead,
  primary,
  secondary,
}: {
  /** 왜 그리로 가는지 한 문장. 링크만 있으면 메뉴지 안내가 아니다. */
  lead: React.ReactNode;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
}) {
  return (
    <div className="mt-20 border-t border-gold/15 pt-12 text-center">
      <p className="mx-auto max-w-md break-keep leading-relaxed text-starlight-dim">{lead}</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        <GoldButton variant="solid" href={primary.href}>
          {primary.label}
        </GoldButton>
        <GoldButton variant="outline" href={secondary.href}>
          {secondary.label}
        </GoldButton>
      </div>
    </div>
  );
}
