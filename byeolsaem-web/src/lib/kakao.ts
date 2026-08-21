// 카카오톡 공유(스펙 §6.2).
//
// SDK는 처음 필요해질 때 한 번만 싣는다. 페이지 로드에 얹으면 공유를 한 번도
// 누르지 않는 사람까지 값을 낸다 — MotionScope와 같은 원칙이다. 다만 클릭
// 순간에 처음 싣기 시작하면 사용자 제스처가 만료돼 팝업이 차단될 수 있으므로,
// 공유 버튼이 화면에 서면 미리 실어 둔다(KakaoShareButton 참고).

/** JavaScript 키. 클라이언트에 심는 것이 정상이다 — 카카오 콘솔에 등록된
 * 도메인에서만 동작하도록 묶여 있다. REST·네이티브 키는 여기 쓰면 안 된다. */
const KAKAO_JS_KEY = "6516527c220b1e6dd951d65fb477c9be";
const SDK_SRC = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";

interface KakaoSdk {
  init(key: string): void;
  isInitialized(): boolean;
  Share: { sendDefault(settings: object): void };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

let loading: Promise<KakaoSdk> | null = null;

export function loadKakao(): Promise<KakaoSdk> {
  if (!loading) {
    loading = new Promise<KakaoSdk>((resolve, reject) => {
      const existing = window.Kakao;
      if (existing?.isInitialized()) {
        resolve(existing);
        return;
      }
      const script = document.createElement("script");
      script.src = SDK_SRC;
      script.async = true;
      script.onload = () => {
        const kakao = window.Kakao;
        if (!kakao) {
          reject(new Error("Kakao SDK가 전역에 없습니다"));
          return;
        }
        if (!kakao.isInitialized()) kakao.init(KAKAO_JS_KEY);
        resolve(kakao);
      };
      script.onerror = () => {
        // 다음 클릭에서 다시 시도할 수 있게 실패한 약속을 버린다.
        loading = null;
        reject(new Error("Kakao SDK를 싣지 못했습니다"));
      };
      document.head.appendChild(script);
    });
  }
  return loading;
}

/**
 * 카카오톡으로 글과 링크를 보낸다. 링크는 이 사이트 안의 경로다 —
 * location.origin을 붙이므로 개발에서는 localhost, 배포에서는 실제 도메인이
 * 되고, 둘 다 카카오 콘솔의 Web 플랫폼에 등록되어 있어야 한다.
 */
export async function shareToKakao(share: {
  text: string;
  path: string;
  buttonTitle?: string;
  /** public/og/ 아래의 카드 경로 (예: "/og/sign/scorpio.png"). 있으면 이미지 카드로 나간다. */
  imagePath?: string;
}): Promise<void> {
  const kakao = await loadKakao();
  const url = location.origin + share.path;
  const link = { webUrl: url, mobileWebUrl: url };

  // 이미지가 있으면 feed — 대화방에서 글자 링크와 이미지 카드의 클릭률 차이가
  // 이 사이트의 유일한 바이럴 채널을 좌우한다(정찰 ④, 2026-08-22).
  // 카카오 서버가 이미지를 가져가야 하므로 절대 주소여야 하고, localhost에서는
  // 못 가져가 텍스트로 폴백하는 편이 낫다.
  if (share.imagePath && location.hostname !== "localhost") {
    kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title: share.text,
        imageUrl: location.origin + share.imagePath,
        link,
      },
      buttons: [{ title: share.buttonTitle ?? "별샘에서 보기", link }],
    });
    return;
  }

  kakao.Share.sendDefault({
    objectType: "text",
    text: share.text,
    link,
    buttonTitle: share.buttonTitle ?? "별샘에서 보기",
  });
}
