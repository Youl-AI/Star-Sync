import { PROVINCES } from "./regions";

/**
 * 광역자치단체의 대표 좌표.
 *
 * 상승궁과 하우스를 구하려면 태어난 곳의 위도와 경도가 필요하다. 원래 계획은
 * 백엔드가 "시도 시군구" 문자열을 지오코딩하는 것이었지만(regions.ts 주석
 * 참고), 계산이 브라우저로 내려온 이상 좌표도 여기 있어야 한다.
 *
 * 시·군·구까지 내려가지 않고 광역 단위에서 멈추는 이유는 정밀도가 그 이상
 * 필요하지 않기 때문이다. 경도 0.5도 차이는 지역 항성시로 2분이고 상승궁으로
 * 0.5도 남짓이다. 태어난 시각을 분 단위로 아는 사람도 드문데, 그 오차가 이미
 * 이보다 크다. 없는 정밀도를 있는 것처럼 보이게 하지 않는다.
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

const PROVINCE_COORDINATES: Record<string, Coordinates> = {
  서울특별시: { latitude: 37.5665, longitude: 126.978 },
  부산광역시: { latitude: 35.1796, longitude: 129.0756 },
  대구광역시: { latitude: 35.8714, longitude: 128.6014 },
  인천광역시: { latitude: 37.4563, longitude: 126.7052 },
  광주광역시: { latitude: 35.1595, longitude: 126.8526 },
  대전광역시: { latitude: 36.3504, longitude: 127.3845 },
  울산광역시: { latitude: 35.5384, longitude: 129.3114 },
  세종특별자치시: { latitude: 36.4801, longitude: 127.289 },
  경기도: { latitude: 37.4138, longitude: 127.5183 },
  강원특별자치도: { latitude: 37.8228, longitude: 128.1555 },
  충청북도: { latitude: 36.6357, longitude: 127.4917 },
  충청남도: { latitude: 36.5184, longitude: 126.8 },
  전북특별자치도: { latitude: 35.7175, longitude: 127.153 },
  전라남도: { latitude: 34.8161, longitude: 126.463 },
  경상북도: { latitude: 36.4919, longitude: 128.8889 },
  경상남도: { latitude: 35.4606, longitude: 128.2132 },
  제주특별자치도: { latitude: 33.4996, longitude: 126.5312 },
};

/**
 * 대한민국의 표준시. 1908년부터 몇 차례 바뀌었지만 1961년 8월 10일 이후로는
 * 줄곧 UTC+9다. 그 이전 출생자는 이 값이 30분 어긋난다 — 지금 방문자 중에는
 * 사실상 없지만, 알고 쓰는 것과 모르고 쓰는 것은 다르다.
 */
export const KOREA_UTC_OFFSET_HOURS = 9;

/**
 * "서울특별시 강남구" 같은 표기에서 좌표를 찾는다.
 *
 * 앞에서부터 광역자치단체 이름을 찾는 방식이라 시·군·구가 붙어 있어도 되고
 * 없어도 된다. 목록에 없는 문자열이면 null을 돌려준다 — 서울로 대신 채워 넣지
 * 않는다. 엉뚱한 좌표로 계산한 하우스는 비어 있는 것보다 나쁘다.
 */
export function coordinatesFor(place: string): Coordinates | null {
  const trimmed = place.trim();
  for (const province of PROVINCES) {
    if (trimmed.startsWith(province.name)) return PROVINCE_COORDINATES[province.name] ?? null;
  }
  return null;
}

/** 좌표를 아는 광역자치단체가 목록과 어긋나지 않는지 확인할 때 쓴다. */
export function knownProvinces(): string[] {
  return Object.keys(PROVINCE_COORDINATES);
}
