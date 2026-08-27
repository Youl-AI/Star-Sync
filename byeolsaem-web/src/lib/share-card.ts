import type { MoonPhaseKey } from "./moon";
import type { ZodiacSign } from "./zodiac";

/**
 * 부적 카드를 이미지로 굽는다(스펙 §6.2 — "공유 이미지 = 아치 카드 형태").
 *
 * 화면의 카드를 DOM째 찍지 않고 캔버스에 다시 그린다. DOM을 찍으려면 폰트를
 * 데이터 URI로 심은 SVG foreignObject를 거쳐야 해서 무겁고 브라우저마다 깨지는
 * 데 비해, 이 카드는 도형 몇 개와 글 몇 줄이라 그리는 쪽이 짧고 결과가 같다.
 * 치수와 색은 ArchCard가 쓰는 값을 그대로 옮겼다 — 화면의 카드와 저장된 카드가
 * 다르게 생겼으면 "내 카드"가 아니다.
 *
 * 글꼴은 화면이 이미 내려받은 것을 쓴다(document.fonts). 캔버스는 CSS 변수를
 * 모르므로 var(--font-display)를 여기서 풀어 넘긴다.
 */

const INK = "#0b0e1a";
const NEBULA = "#1a1f3d";
const STARLIGHT = "#e8e4d8";
const STARLIGHT_DIM = "#9a96a8";
const GOLD = "#c9a227";
const GOLD_SOFT = "#e3c568";

/** 카드의 논리 폭. 화면(240)보다 크게 잡고 통째로 배율만 올린다. */
const W = 320;
const H = W * 1.5;
/** 카드 둘레의 여백. 공유된 이미지가 남의 배경 위에서도 카드로 보이게 한다. */
const PAD = 36;
/** 아래 여백에 들어가는 낙관. */
const FOOTER = "별샘 · byeolsaem.com";

export interface CardSpec {
  name: string;
  latin: string;
  /** 라틴 표기 아래 한 줄. "9. 23 - 10. 23"처럼. */
  range?: string;
  /** 선-다이아-선의 다이아 자리에 앉는 글리프(♌, ☽ 등). 화면 카드의 LineDiamond와 짝. */
  symbol?: string;
  tagline: string;
  /** 아치 안 그림. 좌표계는 카드 왼쪽 위 기준의 논리 픽셀. */
  art: (ctx: CanvasRenderingContext2D, card: { w: number; h: number }) => void;
}

function resolveFont(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || "serif";
}

/** 위는 반원, 아래는 살짝 둥근 부적의 윤곽. ArchCard와 같은 반지름 규칙이다. */
function archPath(x: number, y: number, w: number, h: number, top: number, bottom: number): Path2D {
  const p = new Path2D();
  p.moveTo(x, y + top);
  p.arc(x + top, y + top, top, Math.PI, Math.PI * 1.5);
  p.lineTo(x + w - top, y);
  p.arc(x + w - top, y + top, top, Math.PI * 1.5, 0);
  p.lineTo(x + w, y + h - bottom);
  p.arc(x + w - bottom, y + h - bottom, bottom, 0, Math.PI * 0.5);
  p.lineTo(x + bottom, y + h);
  p.arc(x + bottom, y + h - bottom, bottom, Math.PI * 0.5, Math.PI);
  p.closePath();
  return p;
}

/** ArchCard 위쪽의 여덟 갈래 별. 원본 svg 경로를 14×14 좌표 그대로 옮겼다. */
function drawSeal(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) {
  ctx.save();
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(size / 14, size / 14);
  ctx.fillStyle = GOLD_SOFT;
  ctx.fill(new Path2D("M7 .5 8 4.6l4.5.6L9 8l1 4.5L7 9.9 4 12.5 5 8 1.5 5.2l4.5-.6Z"));
  ctx.restore();
}

/**
 * 선-다이아-선. `symbol`이 오면 다이아 대신 글리프가 앉는다 — 화면 카드의
 * LineDiamond와 같은 규칙이다. 글리프 글꼴은 .astro-symbol의 스택을 그대로
 * 옮겼고(캔버스는 font-variant-emoji를 모르므로), U+FE0E까지 붙여 컬러
 * 이모지 폴백을 막는다.
 */
function drawDiamondRule(ctx: CanvasRenderingContext2D, cx: number, y: number, symbol?: string) {
  const gap = symbol ? 12 : 8;
  ctx.save();
  ctx.strokeStyle = "rgba(201, 162, 39, 0.5)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 34, y);
  ctx.lineTo(cx - gap, y);
  ctx.moveTo(cx + gap, y);
  ctx.lineTo(cx + 34, y);
  ctx.stroke();
  if (symbol) {
    ctx.fillStyle = "rgba(227, 197, 104, 0.9)";
    ctx.font = `13px "Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "Noto Sans Symbols", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbol + "\uFE0E", cx, y + 1);
    ctx.textBaseline = "alphabetic";
  } else {
    ctx.fillStyle = "rgba(227, 197, 104, 0.7)";
    ctx.translate(cx, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-2, -2, 4, 4);
  }
  ctx.restore();
}

/** 공백 기준으로 폭에 맞춰 접는다. 한 어절이 폭을 넘으면 글자 단위로 자른다. */
function wrapLine(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  const push = (piece: string): void => {
    const joined = line ? `${line} ${piece}` : piece;
    if (ctx.measureText(joined).width <= maxWidth) {
      line = joined;
      return;
    }
    if (line) lines.push(line);
    line = piece;
    while (ctx.measureText(line).width > maxWidth && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut -= 1;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  };
  for (const piece of text.split(" ")) push(piece);
  if (line) lines.push(line);
  return lines;
}

async function drawCard(spec: CardSpec): Promise<HTMLCanvasElement> {
  const display = resolveFont("--font-display");
  const latin = resolveFont("--font-latin");
  const body = resolveFont("--font-body");
  // 화면이 아직 그 글꼴로 아무것도 그리지 않았어도 여기서 내려받게 만든다.
  await Promise.all([
    document.fonts.load(`600 22px ${display}`),
    document.fonts.load(`13px ${latin}`),
    document.fonts.load(`italic 13px ${body}`),
  ]).catch(() => {});

  const scale = 3;
  const canvas = document.createElement("canvas");
  canvas.width = (W + PAD * 2) * scale;
  canvas.height = (H + PAD * 2 + 30) * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // 바탕. 투명으로 두면 밝은 채팅방에서 금선만 남고 카드가 사라진다.
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W + PAD * 2, H + PAD * 2 + 30);

  ctx.translate(PAD, PAD);
  const r = W / 2;

  // 바깥 틀 — 옅은 금 바탕에 금선.
  ctx.fillStyle = "rgba(201, 162, 39, 0.05)";
  ctx.fill(archPath(0, 0, W, H, r, 13));
  ctx.strokeStyle = "rgba(201, 162, 39, 0.3)";
  ctx.lineWidth = 1;
  ctx.stroke(archPath(0, 0, W, H, r, 13));

  // 안쪽 카드 — 성운에서 먹으로 내려가는 그라디언트와 금테, 금빛 번짐.
  const inset = 9;
  const inner = archPath(inset, inset, W - inset * 2, H - inset * 2, r - inset, 8);
  const gradient = ctx.createLinearGradient(0, inset, 0, H - inset);
  gradient.addColorStop(0, "rgba(26, 31, 61, 0.9)");
  gradient.addColorStop(1, INK);
  ctx.save();
  ctx.shadowColor = "rgba(201, 162, 39, 0.35)";
  ctx.shadowBlur = 30;
  ctx.fillStyle = gradient;
  ctx.fill(inner);
  ctx.restore();
  ctx.strokeStyle = "rgba(201, 162, 39, 0.6)";
  ctx.stroke(inner);

  drawSeal(ctx, W / 2, inset + 18, 16);

  // 그림. 클리핑을 걸어 아치 밖으로 나가지 않게 한다.
  ctx.save();
  ctx.clip(inner);
  spec.art(ctx, { w: W, h: H });
  ctx.restore();

  // 아래 글 무리. ArchCard와 같은 차례 — 이름, 라틴, 기간, 선-다이아-선, 문구.
  // 문구가 길면 카드 밖으로 흘렀다(2026-08-28) — 폭에 맞춰 접고, 접힌 만큼
  // 무리 전체를 위로 올려 아래 금테를 지키게 한다.
  const cx = W / 2;
  ctx.font = `italic 14px ${body}`;
  const taglineLines = wrapLine(ctx, spec.tagline, W - 64).slice(0, 3);
  let y = H - (spec.range ? 118 : 102) - (taglineLines.length - 1) * 18;
  ctx.textAlign = "center";

  ctx.fillStyle = STARLIGHT;
  ctx.font = `600 25px ${display}`;
  ctx.fillText(spec.name, cx, y);
  y += 26;

  ctx.fillStyle = STARLIGHT_DIM;
  ctx.font = `13px ${latin}`;
  try {
    // 캔버스의 자간은 아직 어디서나 되지는 않는다. 안 되면 그냥 붙여 쓴다.
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "4px";
  } catch {
    /* 지원하지 않는 브라우저 */
  }
  ctx.fillText(spec.latin.toUpperCase(), cx + 2, y);
  if (spec.range) {
    y += 20;
    ctx.fillStyle = "rgba(201, 162, 39, 0.8)";
    ctx.fillText(spec.range, cx + 1, y);
  }
  try {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
  } catch {
    /* 위와 같다 */
  }

  y += 22;
  drawDiamondRule(ctx, cx, y, spec.symbol);
  y += 24;

  ctx.fillStyle = GOLD_SOFT;
  ctx.font = `italic 14px ${body}`;
  for (const [i, line] of taglineLines.entries()) {
    ctx.fillText(line, cx, y + i * 18);
  }

  // 낙관 — 카드 밖 아래.
  ctx.fillStyle = STARLIGHT_DIM;
  ctx.font = `12px ${body}`;
  ctx.fillText(FOOTER, cx, H + PAD + 10);

  return canvas;
}

/** 성좌 그림. SignGlyph와 같은 좌표(260×200 상자, 무리 중심 맞춤)를 쓴다. */
export function signArt(sign: ZodiacSign): CardSpec["art"] {
  return (ctx, card) => {
    const xs = sign.stars.map(([x]) => x);
    const ys = sign.stars.map(([, y]) => y);
    const shiftX = 130 - (Math.min(...xs) + Math.max(...xs)) / 2;
    const shiftY = 100 - (Math.min(...ys) + Math.max(...ys)) / 2;

    // 화면 카드와 같은 비율(ART_WIDTH/CARD_WIDTH)로 아치 안에 앉힌다.
    const artWidth = card.w * (196 / 256);
    const s = artWidth / 260;
    ctx.save();
    ctx.translate((card.w - artWidth) / 2, 52);
    ctx.scale(s, s);
    ctx.translate(shiftX, shiftY);

    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.95;
    ctx.stroke(new Path2D(sign.path));

    sign.stars.forEach(([x, y], index) => {
      if (index === sign.brightest) {
        ctx.beginPath();
        ctx.arc(x, y, 11, 0, Math.PI * 2);
        ctx.strokeStyle = GOLD_SOFT;
        ctx.lineWidth = 1.1;
        ctx.globalAlpha = 0.75;
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = STARLIGHT;
      ctx.globalAlpha = 1;
      ctx.fill();
    });
    ctx.restore();
  };
}

const WAXING = new Set<MoonPhaseKey>(["new", "waxing-crescent", "first-quarter", "waxing-gibbous"]);

/** 달 그림. MoonDisc와 같은 명암 경계식(k = 1 - 2·비율)을 쓴다. */
export function moonArt(illumination: number, phase: MoonPhaseKey): CardSpec["art"] {
  return (ctx, card) => {
    const cx = card.w / 2;
    const cy = 118;
    const r = 62;

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = NEBULA;
    ctx.globalAlpha = 0.55;
    ctx.fill();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    if (illumination > 0.01) {
      const k = 1 - 2 * illumination;
      const rx = Math.abs(k) * r;
      const bright = WAXING.has(phase) ? 1 : -1;
      // MoonDisc와 같은 부호 규칙 — 초승은 밝은 쪽으로, 보름 쪽은 어두운
      // 쪽으로 경계가 볼록하다. 뒤집으면 보름이 빈 원이 된다(2026-08-26).
      const inner = (k >= 0 ? -bright : bright) as 1 | -1;
      const path = new Path2D();
      // 바깥 반원 — 밝은 쪽 가장자리.
      path.arc(cx, cy, r, -Math.PI / 2, Math.PI / 2, bright === -1);
      // 명암 경계 타원 — 반달에서 폭이 0이 된다.
      path.ellipse(cx, cy, rx, r, 0, Math.PI / 2, -Math.PI / 2, inner === -1);
      ctx.globalAlpha = 0.92;
      ctx.fillStyle = STARLIGHT;
      ctx.fill(path);
    }

    ctx.beginPath();
    ctx.arc(cx, cy, r + 8, 0, Math.PI * 2);
    ctx.globalAlpha = 0.14;
    ctx.strokeStyle = GOLD_SOFT;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  };
}

/**
 * 카드를 굽고 건네준다. 터치 기기에서는 공유 시트를(사진 앱에 바로 저장하는
 * 자연스러운 길), 데스크톱에서는 곧장 내려받는다. 무엇이 됐든 파일은 기기
 * 밖으로 나가지 않는다 — 서버가 만드는 것이 아니라 이 브라우저가 그린 것이다.
 *
 * 공유 시트를 터치 기기로 한정하는 이유: Windows 데스크톱 크롬도
 * canShare가 true라 OS 공유 대화상자가 뜨는데, 공유 대상 앱이 없는 환경에서는
 * "공유할 수단이 없습니다" 빈 창이 나온다(2026-08-14 실사용 보고). 데스크톱에서
 * "저장"을 누른 사람이 기대하는 것은 어차피 다운로드다.
 */
export async function shareCard(spec: CardSpec, filename: string): Promise<void> {
  const canvas = await drawCard(spec);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("카드를 그리지 못했습니다");

  const file = new File([blob], filename, { type: "image/png" });
  const touch = matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      // 사용자가 시트를 닫은 경우는 실패가 아니다. 그 외에는 내려받기로 넘어간다.
      if ((error as DOMException).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // 클릭 직후 바로 회수하면 브라우저가 내려받기를 시작하기 전에 주소가
  // 죽을 수 있다(명세상 다운로드 취소). 한 박자 늦춘다.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
