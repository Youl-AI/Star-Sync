// "각인" 인장의 모서리 절단. 왼쪽 위와 오른쪽 아래를 비스듬히 벤 다각형으로,
// GoldButton(주 버튼)과 Veil의 네비 CTA가 같은 형태 언어를 공유한다.
// 크기(padding/폰트)는 사용처마다 다르므로 여기 포함하지 않는다.
export const SEAL_CLIP =
  "[clip-path:polygon(10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%,0_10px)]";

/** 네비처럼 작은 자리용 — 벤 폭도 함께 줄여야 비율이 맞는다. */
export const SEAL_CLIP_SM =
  "[clip-path:polygon(7px_0,100%_0,100%_calc(100%-7px),calc(100%-7px)_100%,0_100%,0_7px)]";
