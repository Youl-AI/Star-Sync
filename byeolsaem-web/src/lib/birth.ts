export function validateBirthDate(y: number, m: number, d: number): boolean {
  if (y < 1900) return false;
  const date = new Date(y, m - 1, d);
  if (date.getTime() > Date.now()) return false;
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
