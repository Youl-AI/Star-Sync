import { navAmbient } from "@/lib/nav-ambient";
import { Veil } from "./Veil";

/** 서버에서 앰비언트 표를 계산해 클라이언트 Veil에 넘긴다. */
export function NavVeil() {
  return <Veil ambient={navAmbient(new Date())} />;
}
