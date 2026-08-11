"use client";
import { useBirthProfile } from "@/hooks/useBirthProfile";

/**
 * 아직 출생 정보를 남기지 않은 사람에게만 보여준다. 무엇을 받게 되는지 설명하는
 * 안내는 이미 자기 결과를 본 사람에게는 지난 이야기다.
 *
 * `ready` 이전에는 감추지 않고 그대로 그린다. 저장소는 클라이언트에서만 읽히므로
 * 서버가 만든 HTML에는 언제나 이 내용이 들어 있어야 한다 — 검색엔진과 자바스크립트
 * 없는 환경이 보는 것이 그 HTML이고, 처음 오는 사람에게는 이 안내가 본문이다.
 *
 * 결과적으로 저장된 정보가 있는 사람의 화면에서는 첫 페인트 직후 이 영역이
 * 사라진다. 위치가 화면 아래 1700px 부근이라 그 순간 화면 안의 무엇도 밀리지
 * 않는다(뷰포트 밖의 변화는 레이아웃 이동으로 집계되지도 않는다).
 */
export function WithoutBirthProfile({ children }: { children: React.ReactNode }) {
  const { profile, ready } = useBirthProfile();
  if (ready && profile) return null;
  return <>{children}</>;
}
