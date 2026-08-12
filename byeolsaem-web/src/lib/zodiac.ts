// 태양궁(별자리) 판정과, 히어로 결과 연출에 쓰는 12궁 성좌 도형.
//
// 날짜 경계는 통용되는 고정 범위(예: 천칭 9.23~10.23)다. 실제 경계는 해마다,
// 태어난 시각에 따라 하루쯤 움직이지만 그 정밀도는 백엔드(kerykeion, 스위스
// 천문력)가 맡는다. 여기 값은 백엔드가 붙기 전의 목업 연출과, 붙은 뒤에도
// 응답을 기다리는 동안의 즉석 표시용이다.
//
// 성좌 좌표는 실제 별자리의 주성 배치를 260×200 viewBox에 맞게 단순화해 옮긴
// 것이다(전갈의 갈고리 꼬리, 황소의 V자 히아데스, 궁수의 주전자 등 각 자리의
// 특징 형태가 알아볼 수 있게). 학술 성도가 아니라 부적의 문양이다.

export interface ZodiacSign {
  key: string;
  /** 화면 표기: "천칭자리" */
  ko: string;
  /** ArchCard의 라틴 표기: "LIBRA SUN" */
  latin: string;
  /** 부적 이름: "균형의 저울" */
  card: string;
  /** 부적 한 줄 문구 */
  tagline: string;
  /** 성좌의 별 좌표 (260×200 viewBox) */
  stars: [number, number][];
  /**
   * 그 자리에서 가장 밝은 별의 `stars` 안 위치. 이 별만 이중 링을 두른다(스펙 §4).
   *
   * 어느 좌표가 어느 별인지는 그림을 단순화하면서 기록해 두지 않았다. 그래서
   * 별 이름이 주석에 남아 있는 자리는 그 순서를 따랐고, 남아 있지 않은 자리는
   * 형태에서 알아볼 수 있는 위치를 골라 별 이름을 함께 적었다. 뒤쪽 넷
   * (천칭·궁수·염소·물병·물고기)은 성도와 대조해 확인한 값이 아니라 그림에서
   * 짚은 값이므로, 틀렸다면 여기 한 줄만 고치면 된다.
   */
  brightest: number;
  /** 별을 잇는 선. M/L 다중 세그먼트 허용 — 드로잉 애니메이션은 전체 길이 기준. */
  path: string;
  /** 화면에 보여줄 기간 표기: "9. 23 - 10. 23" */
  range: string;
  /** 4원소. 불·흙·공기·물 */
  element: "불" | "흙" | "공기" | "물";
  /** 3특질. 활동·고정·변통 */
  quality: "활동" | "고정" | "변통";
  /** 지배 행성 */
  ruler: string;
}

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    key: "aries",
    ko: "양자리",
    latin: "ARIES SUN",
    card: "봄의 불꽃",
    tagline: "시작을 두려워하지 않는 사람",
    // 하말–셰라탄–메사르팀으로 꺾여 내려오는 짧은 활.
    stars: [[205, 78], [152, 60], [112, 78], [96, 94]],
    path: "M205 78 L152 60 L112 78 L96 94",
    /** 하말(α Ari). 주석의 별 순서 그대로 첫 별이다. */
    brightest: 0,
    range: "3. 21 - 4. 19",
    element: "불",
    quality: "활동",
    ruler: "화성",
  },
  {
    key: "taurus",
    ko: "황소자리",
    latin: "TAURUS SUN",
    card: "굳건한 대지",
    tagline: "느리지만 반드시 닿는 사람",
    // 히아데스 V자에서 양쪽 뿔이 뻗어나가는 형태. 알데바란이 위 뿔의 뿌리.
    stars: [[205, 45], [142, 88], [112, 112], [150, 118], [198, 132]],
    path: "M205 45 L142 88 L112 112 L150 118 L198 132",
    /** 알데바란(α Tau). 주석이 말하는 "위 뿔의 뿌리". */
    brightest: 1,
    range: "4. 20 - 5. 20",
    element: "흙",
    quality: "고정",
    ruler: "금성",
  },
  {
    key: "gemini",
    ko: "쌍둥이자리",
    latin: "GEMINI SUN",
    card: "두 갈래 바람",
    tagline: "두 세계를 오가는 사람",
    // 카스토르·폴룩스 두 기둥과 어깨를 잇는 다리.
    stars: [[92, 42], [102, 88], [108, 132], [98, 168], [150, 50], [156, 92], [164, 134], [158, 166]],
    path: "M92 42 L102 88 L108 132 L98 168 M150 50 L156 92 L164 134 L158 166 M102 88 L156 92",
    /** 폴룩스(β Gem). 주석의 "카스토르·폴룩스" 순서에서 둘째 기둥의 머리. */
    brightest: 4,
    range: "5. 21 - 6. 21",
    element: "공기",
    quality: "변통",
    ruler: "수성",
  },
  {
    key: "cancer",
    ko: "게자리",
    latin: "CANCER SUN",
    card: "달빛의 항구",
    tagline: "마음의 조수를 아는 사람",
    // 프레세페를 가운데 두고 갈라지는 희미한 Y.
    stars: [[128, 52], [122, 98], [92, 142], [162, 132]],
    path: "M128 52 L122 98 M122 98 L92 142 M122 98 L162 132",
    /** 알타르프(β Cnc). Y의 남서쪽 발. */
    brightest: 2,
    range: "6. 22 - 7. 22",
    element: "물",
    quality: "활동",
    ruler: "달",
  },
  {
    key: "leo",
    ko: "사자자리",
    latin: "LEO SUN",
    card: "한낮의 왕관",
    tagline: "빛나기를 주저하지 않는 사람",
    // 갈고리(낫) 모양 머리와 데네볼라로 이어지는 몸통 삼각형. 레굴루스가 낫의 끝.
    stars: [[62, 78], [72, 58], [98, 62], [112, 86], [102, 112], [96, 144], [162, 96], [212, 122], [152, 132]],
    path: "M62 78 L72 58 L98 62 L112 86 L102 112 L96 144 M102 112 L162 96 L212 122 L152 132 L102 112",
    /** 레굴루스(α Leo). 주석이 말하는 "낫의 끝". */
    brightest: 5,
    range: "7. 23 - 8. 22",
    element: "불",
    quality: "고정",
    ruler: "태양",
  },
  {
    key: "virgo",
    ko: "처녀자리",
    latin: "VIRGO SUN",
    card: "이삭의 계절",
    tagline: "작은 것을 귀하게 보는 사람",
    // 넓게 벌린 팔과 아래로 떨어지는 스피카.
    stars: [[76, 58], [112, 84], [144, 78], [176, 56], [126, 122], [152, 166]],
    path: "M76 58 L112 84 L144 78 L176 56 M112 84 L126 122 L152 166",
    /** 스피카(α Vir). 주석의 "아래로 떨어지는 스피카" — 그 사슬의 끝. */
    brightest: 5,
    range: "8. 23 - 9. 22",
    element: "흙",
    quality: "변통",
    ruler: "수성",
  },
  {
    key: "libra",
    ko: "천칭자리",
    latin: "LIBRA SUN",
    card: "균형의 저울",
    tagline: "기울어진 것을 바로잡는 사람",
    // 저울대 삼각형과 두 접시 다리.
    stars: [[126, 54], [86, 128], [180, 76], [102, 164], [192, 148]],
    path: "M126 54 L86 128 L180 76 L126 54 M86 128 L102 164 M180 76 L192 148",
    /** 주베네샤말리(β Lib). 두 접시 중 북쪽(위) 것. */
    brightest: 2,
    range: "9. 23 - 10. 23",
    element: "공기",
    quality: "활동",
    ruler: "금성",
  },
  {
    key: "scorpio",
    ko: "전갈자리",
    latin: "SCORPIO SUN",
    card: "깊은 물의 침묵",
    tagline: "끝까지 파고드는 사람",
    // 머리 세 별에서 안타레스를 지나 갈고리로 말려 올라가는 꼬리.
    stars: [[86, 44], [74, 70], [70, 96], [94, 110], [110, 130], [120, 150], [136, 164], [160, 174], [184, 164], [194, 144], [180, 132]],
    path: "M86 44 L74 70 L70 96 L94 110 L110 130 L120 150 L136 164 L160 174 L184 164 L194 144 L180 132",
    /** 안타레스(α Sco). 주석의 "머리 세 별" 다음 자리. */
    brightest: 3,
    range: "10. 24 - 11. 21",
    element: "물",
    quality: "고정",
    ruler: "명왕성",
  },
  {
    key: "sagittarius",
    ko: "궁수자리",
    latin: "SAGITTARIUS SUN",
    card: "먼 곳의 화살",
    tagline: "지평선 너머를 겨누는 사람",
    // 주전자: 몸통 사각형, 왼쪽 주둥이, 오른쪽 위 손잡이.
    stars: [[76, 108], [106, 94], [158, 86], [186, 60], [176, 132], [112, 140], [190, 104]],
    path: "M76 108 L106 94 L158 86 L186 60 M158 86 L190 104 L176 132 L112 140 L106 94",
    /** 카우스 아우스트랄리스(ε Sgr). 주전자 바닥의 왼쪽 모서리. */
    brightest: 5,
    range: "11. 22 - 12. 21",
    element: "불",
    quality: "변통",
    ruler: "목성",
  },
  {
    key: "capricorn",
    ko: "염소자리",
    latin: "CAPRICORN SUN",
    card: "겨울 산의 걸음",
    tagline: "오르막을 견디는 사람",
    // 양끝이 들린 넓은 물결 삼각형(바다염소의 몸).
    stars: [[70, 68], [98, 118], [140, 148], [180, 120], [200, 72], [150, 94], [104, 92]],
    path: "M70 68 L98 118 L140 148 L180 120 L200 72 L150 94 L104 92 L70 68",
    /** 데네브 알게디(δ Cap). 동쪽 끝, 꼬리 쪽. */
    brightest: 4,
    range: "12. 22 - 1. 19",
    element: "흙",
    quality: "활동",
    ruler: "토성",
  },
  {
    key: "aquarius",
    ko: "물병자리",
    latin: "AQUARIUS SUN",
    card: "새벽의 물결",
    tagline: "내일을 먼저 사는 사람",
    // 어깨의 지그재그 물줄기와 아래로 흐르는 물.
    stars: [[68, 88], [94, 72], [116, 90], [142, 74], [166, 92], [192, 76], [122, 138], [138, 168]],
    path: "M68 88 L94 72 L116 90 L142 74 L166 92 L192 76 M116 90 L122 138 L138 168",
    /** 사달수드(β Aqr). 어깨 지그재그의 서쪽 봉우리. */
    brightest: 1,
    range: "1. 20 - 2. 18",
    element: "공기",
    quality: "고정",
    ruler: "천왕성",
  },
  {
    key: "pisces",
    ko: "물고기자리",
    latin: "PISCES SUN",
    card: "꿈의 바다",
    tagline: "경계 없이 스며드는 사람",
    // 끈으로 묶인 두 마리 물고기 — 오른쪽 고리(서쪽 물고기)와 왼쪽 위 물고기.
    stars: [[182, 58], [202, 54], [212, 70], [196, 82], [112, 150], [76, 86], [62, 74], [72, 60], [86, 70]],
    path: "M182 58 L202 54 L212 70 L196 82 L182 58 M196 82 L112 150 L76 86 M76 86 L62 74 L72 60 L86 70 L76 86",
    /** 에타 피스키움(η Psc). 북쪽 물고기 몸통의 시작. */
    brightest: 5,
    range: "2. 19 - 3. 20",
    element: "물",
    quality: "변통",
    ruler: "해왕성",
  },
];

// 각 별자리가 시작되는 날짜 (월, 일). 이 날짜 "이후"면 해당 자리.
// 염소자리는 연말~연초에 걸쳐 있어 목록 밖(기본값)으로 처리한다.
const SIGN_STARTS: [number, number, string][] = [
  [1, 20, "aquarius"],
  [2, 19, "pisces"],
  [3, 21, "aries"],
  [4, 20, "taurus"],
  [5, 21, "gemini"],
  [6, 22, "cancer"],
  [7, 23, "leo"],
  [8, 23, "virgo"],
  [9, 23, "libra"],
  [10, 24, "scorpio"],
  [11, 22, "sagittarius"],
  [12, 22, "capricorn"],
];

/** "1999-09-27" → 천칭자리. 형식이 깨진 입력은 양자리(첫 자리)로 안전하게 떨어진다. */
/**
 * 황경이 어느 자리에 드는가. 30도가 한 자리다.
 *
 * 날짜로 태양궁을 찾는 getSunSign과 달리 실제 위치를 그대로 나눈다. 역행 화면과
 * 오늘의 하늘처럼 계산된 황경을 다루는 곳이 쓴다.
 */
export function signAtLongitude(longitude: number): ZodiacSign {
  const index = Math.floor(((((longitude % 360) + 360) % 360)) / 30);
  return ZODIAC_SIGNS[index];
}

export function getSunSign(isoDate: string): ZodiacSign {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return ZODIAC_SIGNS[0];
  const month = Number(m[2]);
  const day = Number(m[3]);
  const stamp = month * 100 + day;

  let key = "capricorn"; // 1월 1일~19일은 어느 시작점보다 앞 → 염소자리
  for (const [sm, sd, sk] of SIGN_STARTS) {
    if (stamp >= sm * 100 + sd) key = sk;
  }
  return ZODIAC_SIGNS.find((s) => s.key === key) ?? ZODIAC_SIGNS[0];
}
