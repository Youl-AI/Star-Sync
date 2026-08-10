"use client";

import { useEffect, useRef, useState } from "react";
import { KO_CITIES, validateBirthDate } from "@/lib/birth";

export interface RitualData {
  date: string;
  time: string | null;
  city: string;
  concern: string;
}

const CONCERNS = ["재물운", "연애운", "직업운", "학업운", "건강운", "대인운", "이동운"];
const STEP_LABELS = ["생년월일", "태어난 시간", "태어난 도시", "관심사"] as const;
const TOTAL_STEPS = STEP_LABELS.length;

function parseDate(raw: string) {
  const m = raw.trim().match(/^(\d{4})[.\-\s]?(\d{1,2})[.\-\s]?(\d{1,2})$/);
  if (!m) return null;
  return { y: Number(m[1]), mo: Number(m[2]), d: Number(m[3]) };
}

function parseTime(raw: string): { ok: true; value: string | null } | { ok: false } {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: null };
  const m = trimmed.match(/^([01]?\d|2[0-3])[:.\s]?([0-5]\d)$/);
  if (!m) return { ok: false };
  return { ok: true, value: `${m[1].padStart(2, "0")}:${m[2]}` };
}

const UNDERLINE_INPUT =
  "w-full border-0 border-b border-gold/60 bg-transparent px-1 py-2 text-center font-display text-2xl tracking-[0.02em] text-starlight caret-gold outline-none placeholder:text-starlight-dim/40 focus:border-gold-soft md:text-3xl";
const SKIP_LINK =
  "text-[11px] tracking-wide text-starlight-dim underline underline-offset-4 transition-colors hover:text-starlight";
const NEXT_LINK =
  "text-xs tracking-[0.08em] text-gold-soft underline-offset-4 transition-colors hover:text-starlight hover:underline";

export function RitualForm({ onComplete }: { onComplete: (data: RitualData) => void }) {
  const [step, setStep] = useState(0);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [city, setCity] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [finalTime, setFinalTime] = useState<string | null>(null);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const firstConcernRef = useRef<HTMLButtonElement>(null);

  // 단계가 바뀔 때마다 새 입력(또는 마지막 단계의 첫 번째 선택지)으로 포커스를 옮긴다.
  // 키보드 사용자가 단계마다 Tab을 눌러 찾아갈 필요가 없게 하기 위함.
  useEffect(() => {
    if (step === 3) firstConcernRef.current?.focus();
    else inputRef.current?.focus();
  }, [step]);

  const goToStep = (next: number) => {
    setError("");
    setStep(next);
  };

  const submitDate = () => {
    const parsed = parseDate(dateInput);
    if (!parsed || !validateBirthDate(parsed.y, parsed.mo, parsed.d)) {
      setError("실재하는 날짜를 입력해 주세요");
      return;
    }
    setIsoDate(
      `${parsed.y}-${String(parsed.mo).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`
    );
    goToStep(1);
  };

  const submitTime = () => {
    const parsed = parseTime(timeInput);
    if (!parsed.ok) {
      setError("시:분 형식으로 입력해 주세요 (예: 21:44)");
      return;
    }
    setFinalTime(parsed.value);
    goToStep(2);
  };

  const skipTime = () => {
    setFinalTime(null);
    goToStep(2);
  };

  const submitCity = () => {
    const trimmed = city.trim();
    if (trimmed.length === 0) {
      setError("도시를 선택해 주세요");
      return;
    }
    setCity(trimmed);
    goToStep(3);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) submitDate();
    else if (step === 1) submitTime();
    else if (step === 2) submitCity();
  };

  const clearErrorOnChange = () => {
    if (error) setError("");
  };

  return (
    <div className="mx-auto w-full max-w-xs">
      <p className="sr-only" aria-live="polite">
        {`${TOTAL_STEPS}단계 중 ${step + 1}단계: ${STEP_LABELS[step]}`}
      </p>

      <form onSubmit={handleSubmit} className="text-center" noValidate>
        {step === 0 && (
          <>
            <label htmlFor="ritual-date" className="sr-only">
              생년월일
            </label>
            <input
              ref={inputRef}
              id="ritual-date"
              name="date"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="next"
              placeholder="1999 . 03 . 21"
              className={UNDERLINE_INPUT}
              value={dateInput}
              onChange={(e) => {
                setDateInput(e.target.value);
                clearErrorOnChange();
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "ritual-error" : undefined}
            />
            <p className="mt-3 text-[11px] tracking-wide text-starlight-dim">
              생년월일을 입력하면 그날의 하늘이 펼쳐집니다
            </p>
            <button type="submit" className={`mt-4 ${NEXT_LINK}`}>
              다음
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <label htmlFor="ritual-time" className="sr-only">
              태어난 시간
            </label>
            <input
              ref={inputRef}
              id="ritual-time"
              name="time"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              enterKeyHint="next"
              placeholder="21 : 44"
              className={UNDERLINE_INPUT}
              value={timeInput}
              onChange={(e) => {
                setTimeInput(e.target.value);
                clearErrorOnChange();
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "ritual-error" : undefined}
            />
            <div className="mt-4 flex flex-col items-center gap-3">
              <button type="submit" className={NEXT_LINK}>
                다음
              </button>
              <button type="button" className={SKIP_LINK} onClick={skipTime}>
                태어난 시간을 몰라요
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <label htmlFor="ritual-city" className="sr-only">
              태어난 도시
            </label>
            <input
              ref={inputRef}
              id="ritual-city"
              name="city"
              type="text"
              list="ritual-cities"
              autoComplete="off"
              enterKeyHint="next"
              placeholder="태어난 도시"
              className={UNDERLINE_INPUT}
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                clearErrorOnChange();
              }}
              aria-invalid={!!error}
              aria-describedby={error ? "ritual-error" : undefined}
            />
            <datalist id="ritual-cities">
              {KO_CITIES.map((c) => (
                <option key={c.en} value={c.ko} />
              ))}
            </datalist>
            <button type="submit" className={`mt-4 ${NEXT_LINK}`}>
              다음
            </button>
          </>
        )}

        {step === 3 && (
          <div
            role="group"
            aria-label="관심사 선택"
            className="flex flex-wrap justify-center gap-2.5"
          >
            {CONCERNS.map((c, i) => (
              <button
                key={c}
                ref={i === 0 ? firstConcernRef : undefined}
                type="button"
                onClick={() =>
                  onComplete({ date: isoDate, time: finalTime, city, concern: c })
                }
                className="rounded-full border border-gold/50 px-4 py-2 text-xs text-gold-soft transition-colors hover:border-gold hover:text-starlight active:scale-[0.98]"
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p id="ritual-error" role="alert" className="mt-3 text-xs text-gold-soft/90">
            {error}
          </p>
        )}
      </form>

      <div className="mt-6 flex justify-center gap-2" aria-hidden>
        {STEP_LABELS.map((_, i) => (
          <span
            key={i}
            className={`size-1.5 rounded-full transition-colors duration-300 ${
              i <= step ? "bg-gold-soft" : "border border-starlight-dim/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
