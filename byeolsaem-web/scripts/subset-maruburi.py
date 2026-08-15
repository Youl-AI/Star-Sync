"""마루부리를 제목에 필요한 글자만 남기고 잘라 낸다.

왜 필요한가. 마루부리는 Naver가 통짜 파일로만 배포한다(Regular 424KB, Bold 441KB).
본문 Pretendard는 동적 서브셋으로 279KB까지 내려왔는데, 그 뒤로는 제목 폰트 865KB가
페이지에서 제일 무거운 자원이 된다 — §7의 LCP 예산에 그대로 걸린다.

무엇을 남기는가.

  1) KS X 1001 완성형 2,350자.
     "자주 쓰는 글자 몇 개"를 손으로 고르면 언젠가 반드시 빠진 글자가 제목 한가운데서
     본문 폰트로 떨어진다. 그래서 표준 집합을 통째로 남긴다. EUC-KR로 인코딩되는
     한글 음절이 정확히 이 집합이므로 코덱으로 뽑는다 — 목록을 손으로 적지 않는다.
  2) 저장소에 실제로 쓰인 글자 전부.
     1)에 없는 글자를 쓴 곳이 있으면(예: 옛한글, 특수 음절) 함께 남긴다.
  3) 라틴·숫자·문장부호와 이 사이트가 쓰는 기호(· — ° ' ☉ ☽ 등).

제목 폰트에는 사용자가 입력한 문자열이 들어가지 않는다. 제목·별자리 이름·카드
이름·MDX 소제목은 모두 저장소 안에 있는 글이므로 2)가 실제 사용 범위를 덮는다.

쓰는 법:  python scripts/subset-maruburi.py
원본은 scripts/vendor/에 두고, 결과만 src/fonts/에 쓴다.
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VENDOR = Path(__file__).resolve().parent / "vendor"
OUT = ROOT / "src" / "fonts"

# 저장소에서 글자를 긁어올 범위. 화면에 나가는 글이 들어 있는 곳만 본다.
SOURCE_DIRS = [ROOT / "src"]
SOURCE_SUFFIXES = {".ts", ".tsx", ".mdx", ".css"}

# 사이트가 쓰는 기호. 소스에서 긁히기는 하지만, 조건부로만 나오는 것이 있어
# 명시해 둔다(행성·어스펙트 기호는 .astro-symbol이 별도 폰트로 그리지만,
# 폴백이 마루부리로 떨어지는 경우가 있어 함께 남긴다).
EXTRA = (
    " !\"#$%&'()*+,-./0123456789:;<=>?@"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`"
    "abcdefghijklmnopqrstuvwxyz{|}~"
    "·—–…‘’“”′″°※→←↑↓"
    "☉☽☿♀♂♃♄♅♆♇☌☍△□⚹℞"
    " ︎"
)


def ks_x_1001_syllables() -> set[str]:
    """KS X 1001 완성형 한글 음절 2,350자.

    파이썬의 euc_kr 코덱만으로는 가려낼 수 없다. 이 코덱은 실제로는 CP949(UHC)라
    한글 음절 11,172자를 전부 인코딩한다 — 그대로 쓰면 서브셋이 아무것도 걸러내지
    않는다. KS X 1001 본래 영역은 두 바이트가 모두 0xA1–0xFE인 것이므로, CP949가
    뒤에 덧붙인 확장 영역은 선두 바이트로 갈린다.
    """
    found = set()
    for code in range(0xAC00, 0xD7A4):
        ch = chr(code)
        try:
            encoded = ch.encode("euc-kr")
        except UnicodeEncodeError:
            continue
        if len(encoded) == 2 and all(0xA1 <= byte <= 0xFE for byte in encoded):
            found.add(ch)
    return found


def characters_in_repo() -> set[str]:
    found = set()
    for base in SOURCE_DIRS:
        for path in base.rglob("*"):
            if path.suffix not in SOURCE_SUFFIXES or not path.is_file():
                continue
            found.update(path.read_text(encoding="utf-8", errors="ignore"))
    return found


def subset(source: Path, target: Path, text: str, flavor: str = "woff2") -> None:
    subprocess.run(
        [
            sys.executable,
            "-m",
            "fontTools.subset",
            str(source),
            f"--text={text}",
            *([f"--flavor={flavor}"] if flavor else []),
            f"--output-file={target}",
            "--layout-features=*",
            "--no-hinting",
            "--desubroutinize",
        ],
        check=True,
    )


# ── 공유 카드(OG 이미지)용 ────────────────────────────────────────────────
#
# 링크 미리보기 이미지는 빌드할 때 Satori가 그리는데, 이 엔진은 woff2를 읽지
# 못한다(ttf·otf·woff만). 게다가 폰트가 이미지 번들 500KB 안에 들어가야 해서
# 위의 2,500자짜리 서브셋을 ttf로 바꾸면(약 3MB) 예산을 한참 넘긴다.
#
# 그래서 공유 카드에 실제로 찍히는 글자만 따로 잘라 ttf로 낸다. 그 글자는
# 사이트 이름과 열두 별자리의 이름·기간·한 줄 문구뿐이라 200자 안팎이다.
OG_TEXT_SOURCES = [ROOT / "src" / "lib" / "zodiac.ts"]
OG_EXTRA = (
    "별샘"
    "당신이 태어난 밤, 하늘은 기억하고 있어요"
    "태어난 순간의 실제 하늘로 읽는 나의 이야기"
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    "abcdefghijklmnopqrstuvwxyz"
    "0123456789 .,-·—'"
)


def og_charset() -> set[str]:
    found = set(OG_EXTRA)
    for path in OG_TEXT_SOURCES:
        found.update(path.read_text(encoding="utf-8", errors="ignore"))
    # 소스 파일에서 긁으므로 코드에 쓰인 라틴·기호가 섞여 들어온다. 한글과
    # 위에서 명시한 것만 남기면 글리프 수가 크게 줄어든다.
    return {c for c in found if ("가" <= c <= "힣" or c in OG_EXTRA) and c.isprintable()}


def main() -> None:
    charset = ks_x_1001_syllables() | characters_in_repo() | set(EXTRA)
    # 제어문자는 글리프가 없다.
    charset = {c for c in charset if c.isprintable() or c in " ︎"}
    text = "".join(sorted(charset))
    print(f"남길 글자 {len(charset):,}자")

    # 남긴 글자를 적어 둔다. 나중에 글을 추가하고 이 스크립트를 다시 돌리는 것을
    # 잊으면 제목 한가운데서 글자 하나가 본문 폰트로 떨어지는데, 화면을 직접 보지
    # 않으면 알아채기 어렵다. maruburi-subset.test.ts가 이 파일과 저장소를 비교해
    # 그 상황을 실패로 만든다.
    (OUT / "maruburi-subset.txt").write_text(text, encoding="utf-8")

    for name in ("MaruBuri-Regular", "MaruBuri-Bold"):
        source = VENDOR / f"{name}.woff2"
        target = OUT / f"{name}.woff2"
        if not source.exists():
            raise SystemExit(
                f"원본이 없습니다: {source}\n"
                "  curl -o scripts/vendor/{name}.woff2 \\\n"
                f"    https://hangeul.pstatic.net/hangeul_static/webfont/MaruBuri/{name}.woff2"
            )
        subset(source, target, text)
        before = source.stat().st_size
        after = target.stat().st_size
        print(f"{name}: {before / 1024:,.0f}KB → {after / 1024:,.0f}KB")

    # 공유 카드용 ttf (OG_TEXT_SOURCES 주석 참고)
    og_text = "".join(sorted(og_charset()))
    og_target = OUT / "MaruBuri-OG.ttf"
    subset(VENDOR / "MaruBuri-Bold.woff2", og_target, og_text, flavor="")
    print(f"MaruBuri-OG.ttf: {len(og_charset()):,}자 → {og_target.stat().st_size / 1024:,.0f}KB")


if __name__ == "__main__":
    main()
