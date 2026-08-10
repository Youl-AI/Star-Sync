export function validateBirthDate(y: number, m: number, d: number): boolean {
  if (y < 1900) return false;
  const date = new Date(y, m - 1, d);
  if (date.getTime() > Date.now()) return false;
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export const KO_CITIES: { ko: string; en: string }[] = [
  { ko: "서울", en: "Seoul" }, { ko: "부산", en: "Busan" }, { ko: "인천", en: "Incheon" },
  { ko: "대구", en: "Daegu" }, { ko: "대전", en: "Daejeon" }, { ko: "광주", en: "Gwangju" },
  { ko: "울산", en: "Ulsan" }, { ko: "수원", en: "Suwon" }, { ko: "성남", en: "Seongnam" },
  { ko: "고양", en: "Goyang" }, { ko: "용인", en: "Yongin" }, { ko: "창원", en: "Changwon" },
  { ko: "청주", en: "Cheongju" }, { ko: "전주", en: "Jeonju" }, { ko: "천안", en: "Cheonan" },
  { ko: "제주", en: "Jeju" }, { ko: "포항", en: "Pohang" }, { ko: "김해", en: "Gimhae" },
  { ko: "춘천", en: "Chuncheon" }, { ko: "강릉", en: "Gangneung" },
];
