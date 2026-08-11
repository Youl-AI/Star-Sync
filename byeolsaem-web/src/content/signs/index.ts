import type { SignContent } from "@/lib/sign-content";
import { aries } from "./aries";
import { taurus } from "./taurus";
import { gemini } from "./gemini";
import { cancer } from "./cancer";
import { leo } from "./leo";
import { virgo } from "./virgo";
import { libra } from "./libra";
import { scorpio } from "./scorpio";
import { sagittarius } from "./sagittarius";
import { capricorn } from "./capricorn";
import { aquarius } from "./aquarius";
import { pisces } from "./pisces";

/**
 * 열두 별자리 본문.
 *
 * 한 자리에 한 파일이다. 한 덩어리로 두면 3천 줄이 넘어가 어느 자리를 고치든
 * 파일 전체를 열어야 하고, 두 자리를 동시에 손볼 때 충돌이 난다.
 *
 * 이 데이터는 서버 컴포넌트에서만 읽힌다. `/sign/<별자리>`가 빌드 시점에
 * HTML로 구워 내므로 브라우저 번들에는 한 글자도 실리지 않는다.
 */
export const SIGN_BODIES: Record<string, SignContent> = {
  aries,
  taurus,
  gemini,
  cancer,
  leo,
  virgo,
  libra,
  scorpio,
  sagittarius,
  capricorn,
  aquarius,
  pisces,
};
