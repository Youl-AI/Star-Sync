import type { MDXComponents } from "mdx/types";
import { Link } from "@/components/ui/Link";
import { DawnChip } from "@/components/dawn/Chip";

/**
 * MDX가 만들어 내는 태그를 이 사이트의 글꼴·간격에 맞춘다.
 *
 * 문단·목록·링크·굵은 글씨는 `.dawn-prose`가 이미 CSS로 잡고 있어서 여기서
 * 손대지 않는다. 글 안에서 클래스를 일일이 달 수 없는 태그들이라 부모 한
 * 곳에서 자손 선택자로 정한 것이고, 그 규칙을 여기서 또 덮으면 두 곳을
 * 관리하게 된다.
 *
 * 여기서 정하는 것은 CSS가 다루지 않는 것들 — 제목의 위계와 내부 링크다.
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h2: (props) => (
      <h2 className="mt-12 break-keep font-display text-xl text-ink-text" {...props} />
    ),
    h3: (props) => (
      <h3 className="mt-9 break-keep font-display text-lg text-ink-text" {...props} />
    ),
    // 사이트 안의 링크는 next/link로 바꿔 넘긴다. 글 안에서 다른 페이지로 가는
    // 길이 전체 새로고침이 되면 읽던 자리도 스크롤 위치도 잃는다.
    a: ({ href, ...props }) =>
      href && href.startsWith("/") ? (
        <Link href={href} {...props} />
      ) : (
        <a href={href} {...props} />
      ),
    DawnChip,
    ...components,
  };
}
