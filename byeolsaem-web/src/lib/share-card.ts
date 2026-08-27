import type { MoonPhaseKey } from "./moon";
import { SIGN_SYMBOL, ZODIAC_SIGNS, type ZodiacSign } from "./zodiac";

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

const ASTRO_FONT = '"Segoe UI Symbol", "Apple Symbols", "Noto Sans Symbols2", "Noto Sans Symbols", sans-serif';

export interface WheelArtData {
  placements: { symbol: string; longitude: number; retrograde: boolean }[];
  /** 상승궁 황경. 시각 미상이면 null — 그때는 양자리 0도가 왼쪽에 온다. */
  ascendant: number | null;
  /** 카드에 그릴 어스펙트 현 — 화면이 고른 것과 같은 목록을 받는다. */
  aspects: { a: number; b: number; harmony: number }[];
}

/**
 * 천궁도 원반 그림. ChartWheel과 같은 투영(상승궁이 왼쪽, 황경이 늘수록
 * 반시계)을 캔버스로 옮긴 축약본이다 — 천궁도 카드가 태양 별자리 성좌를
 * 그대로 쓰는 것은 카드가 아니라 남의 옷이었다(2026-08-28).
 */
export function wheelArt(data: WheelArtData): CardSpec["art"] {
  return (ctx, card) => {
    const cx = card.w / 2;
    const cy = 152;
    const R = 104;
    const BAND = 15;
    const rotation = data.ascendant ?? 0;
    const pt = (longitude: number, radius: number): [number, number] => {
      const angle = ((180 + (longitude - rotation)) * Math.PI) / 180;
      return [cx + Math.cos(angle) * radius, cy - Math.sin(angle) * radius];
    };

    // 네 개의 링 — 화면 원반과 같은 골격(자리 띠 둘, 하우스 링, 어스펙트 링).
    // 처음엔 바깥 두 링뿐이어서 현들이 허공에 떠 보였다(피드백 2026-08-28).
    const HOUSE_R = R - BAND - 5;
    const ASPECT_R = 42;
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 0.8;
    for (const [r, alpha] of [
      [R, 0.4],
      [R - BAND, 0.4],
      [HOUSE_R, 0.16],
      [ASPECT_R, 0.22],
    ] as const) {
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 12; i += 1) {
      const [x0, y0] = pt(i * 30, R);
      const [x1, y1] = pt(i * 30, R - BAND);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    // 자리 글리프 — 띠 가운데.
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = GOLD_SOFT;
    ctx.font = `8px ${ASTRO_FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ZODIAC_SIGNS.forEach((sign, i) => {
      const [x, y] = pt(i * 30 + 15, R - BAND / 2);
      ctx.fillText(`${SIGN_SYMBOL[sign.key]}\uFE0E`, x, y);
    });

    // 지평선 — 상승궁이 있을 때만. 화면처럼 하우스 링과 어스펙트 링 사이에만
    // 긋는다. 중심까지 밀면 현들과 뒤엉킨다(피드백 2026-08-28).
    if (data.ascendant !== null) {
      const [x0, y0] = pt(data.ascendant, HOUSE_R);
      const [x1, y1] = pt(data.ascendant, ASPECT_R);
      ctx.strokeStyle = GOLD;
      ctx.globalAlpha = 0.85;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }

    // 어스펙트 현 — 어스펙트 링 위의 두 점을 잇고, 끝점을 작은 점으로 마감한다.
    // 금색이 순풍, 흐린 선이 맞바람 — 화면 원반과 같은 문법.
    ctx.lineWidth = 0.7;
    for (const asp of data.aspects) {
      const [x0, y0] = pt(asp.a, ASPECT_R);
      const [x1, y1] = pt(asp.b, ASPECT_R);
      ctx.strokeStyle = asp.harmony >= 0 ? GOLD_SOFT : STARLIGHT;
      ctx.globalAlpha = asp.harmony >= 0 ? 0.55 : 0.28;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = GOLD_SOFT;
    for (const asp of data.aspects) {
      for (const lon of [asp.a, asp.b]) {
        const [x, y] = pt(lon, ASPECT_R);
        ctx.beginPath();
        ctx.arc(x, y, 1.3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 별 글리프 — 황경이 가까우면 반지름을 안쪽으로 번갈아 내려 겹침을 푼다.
    // 10도 문턱으로는 13~14도 간격의 무리(토성·목성·달)가 그대로 붙었다.
    const sorted = [...data.placements].sort((a, b) => a.longitude - b.longitude);
    ctx.globalAlpha = 1;
    let level = 0;
    let prev = Number.NEGATIVE_INFINITY;
    for (const p of sorted) {
      level = p.longitude - prev < 16 ? (level + 1) % 2 : 0;
      prev = p.longitude;
      const [x, y] = pt(p.longitude, level === 0 ? 68 : 55);
      ctx.fillStyle = STARLIGHT;
      ctx.font = `11px ${ASTRO_FONT}`;
      ctx.fillText(`${p.symbol}\uFE0E`, x, y);
      if (p.retrograde) {
        ctx.fillStyle = GOLD_SOFT;
        ctx.font = `5.5px ${ASTRO_FONT}`;
        ctx.fillText("R", x + 6.5, y - 5);
      }
    }
    ctx.textBaseline = "alphabetic";
  };
}

export interface WheelImageData extends WheelArtData {
  /** 홀사인 커스프 12개. 시각 미상이면 null — 하우스 층을 통째로 생략한다. */
  houseCusps: number[] | null;
  /** 원반 아래 낙관 앞에 붙는 한 줄 — 생년월일 등. */
  caption?: string;
}

/**
 * 화면 원반의 정밀본 — 부적 카드의 축약 원반이 아니라 ChartWheel의 층위
 * (자리 이름, 하우스 번호, 축, ASC 라벨)를 그대로 옮긴 단독 이미지다.
 * "원반 자체를 저장하고 싶다"는 요청(2026-08-28)에서 나왔다.
 */
async function drawWheelImage(data: WheelImageData): Promise<HTMLCanvasElement> {
  const display = resolveFont("--font-display");
  const latin = resolveFont("--font-latin");
  const body = resolveFont("--font-body");
  await Promise.all([
    document.fonts.load(`11px ${display}`),
    document.fonts.load(`10px ${latin}`),
    document.fonts.load(`12px ${body}`),
  ]).catch(() => {});

  const scale = 3;
  const W = 430;
  const H = 470;
  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);

  const cx = W / 2;
  const cy = 214;
  const OUTER = 180;
  const BAND = 26;
  const SIGN_IN = OUTER - BAND;
  const HOUSE_R = SIGN_IN - 8;
  const NUM_R = HOUSE_R - 12;
  const PLANET_R = 112;
  const PLANET_R_IN = 93;
  const ASPECT_R = 74;
  const rotation = data.ascendant ?? 0;
  const pt = (longitude: number, radius: number): [number, number] => {
    const angle = ((180 + (longitude - rotation)) * Math.PI) / 180;
    return [cx + Math.cos(angle) * radius, cy - Math.sin(angle) * radius];
  };

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 링들 — ChartWheel과 같은 층위.
  ctx.strokeStyle = GOLD;
  for (const [r, alpha, width] of [
    [OUTER, 0.45, 1],
    [SIGN_IN, 0.4, 1],
    [ASPECT_R, 0.25, 0.9],
  ] as const) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (data.houseCusps) {
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = STARLIGHT;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.arc(cx, cy, HOUSE_R, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 자리 경계 눈금과 이름.
  ctx.strokeStyle = GOLD;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = 0.8;
  for (let i = 0; i < 12; i += 1) {
    const [x0, y0] = pt(i * 30, OUTER);
    const [x1, y1] = pt(i * 30, SIGN_IN);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = GOLD_SOFT;
  ctx.font = `11px ${display}`;
  ZODIAC_SIGNS.forEach((sign, i) => {
    const [x, y] = pt(i * 30 + 15, OUTER - BAND / 2);
    ctx.fillText(sign.ko.replace("자리", ""), x, y);
  });

  // 하우스 — 커스프 선과 번호. 1·10하우스 경계가 이 차트의 축이다.
  if (data.houseCusps) {
    data.houseCusps.forEach((cusp, i) => {
      const axis = i === 0 || i === 9;
      const [x0, y0] = pt(cusp, SIGN_IN);
      const [x1, y1] = pt(cusp, ASPECT_R);
      ctx.strokeStyle = axis ? GOLD : STARLIGHT;
      ctx.globalAlpha = axis ? 0.8 : 0.22;
      ctx.lineWidth = axis ? 1.5 : 0.7;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      const [nx, ny] = pt(cusp + 15, NUM_R);
      ctx.fillStyle = STARLIGHT_DIM;
      ctx.globalAlpha = 0.85;
      ctx.font = `9.5px ${latin}`;
      ctx.fillText(String(i + 1), nx, ny);
    });
    // ASC 라벨 — 지평선 바깥.
    if (data.ascendant !== null) {
      const [ax, ay] = pt(data.ascendant, OUTER + 14);
      ctx.fillStyle = GOLD;
      ctx.globalAlpha = 0.95;
      ctx.font = `9px ${latin}`;
      ctx.fillText("ASC", ax, ay);
    }
  }

  // 어스펙트 현 — 금색이 순풍, 흐린 선이 맞바람. 끝점은 작은 점으로 마감.
  ctx.lineWidth = 0.9;
  for (const asp of data.aspects) {
    const [x0, y0] = pt(asp.a, ASPECT_R);
    const [x1, y1] = pt(asp.b, ASPECT_R);
    ctx.strokeStyle = asp.harmony >= 0 ? GOLD_SOFT : STARLIGHT;
    ctx.globalAlpha = asp.harmony >= 0 ? 0.55 : 0.3;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = GOLD_SOFT;
  for (const asp of data.aspects) {
    for (const lon of [asp.a, asp.b]) {
      const [x, y] = pt(lon, ASPECT_R);
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 별 글리프 — 카드 원반과 같은 겹침 풀기.
  const sorted = [...data.placements].sort((a, b) => a.longitude - b.longitude);
  ctx.globalAlpha = 1;
  let level = 0;
  let prev = Number.NEGATIVE_INFINITY;
  for (const p of sorted) {
    level = p.longitude - prev < 12 ? (level + 1) % 2 : 0;
    prev = p.longitude;
    const [x, y] = pt(p.longitude, level === 0 ? PLANET_R : PLANET_R_IN);
    ctx.fillStyle = STARLIGHT;
    ctx.font = `15px ${ASTRO_FONT}`;
    ctx.fillText(`${p.symbol}\uFE0E`, x, y);
    if (p.retrograde) {
      ctx.fillStyle = GOLD_SOFT;
      ctx.font = `7px ${ASTRO_FONT}`;
      ctx.fillText("R", x + 9, y - 7);
    }
  }

  // 낙관.
  ctx.fillStyle = STARLIGHT_DIM;
  ctx.globalAlpha = 1;
  ctx.font = `12px ${body}`;
  ctx.fillText(data.caption ? `${data.caption} · ${FOOTER}` : FOOTER, cx, H - 22);
  ctx.textBaseline = "alphabetic";

  return canvas;
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
  await deliverCanvas(await drawCard(spec), filename);
}

/** 화면 원반의 정밀본을 굽고 건네준다 — 전달 경로는 카드와 같다. */
export async function shareWheel(data: WheelImageData, filename: string): Promise<void> {
  await deliverCanvas(await drawWheelImage(data), filename);
}

async function deliverCanvas(canvas: HTMLCanvasElement, filename: string): Promise<void> {
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
