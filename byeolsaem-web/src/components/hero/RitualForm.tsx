"use client";

import { useEffect, useRef, useState } from "react";
import { validateBirthDate } from "@/lib/birth";
import {
  OVERSEAS,
  PROVINCES,
  filterDistricts,
  filterProvinces,
  formatPlace,
  matchesQuery,
} from "@/lib/regions";
import {
  formatDateInput,
  formatTimeInput,
  parseDate,
  parseTime,
} from "@/lib/ritual-input";
import { RitualCombobox } from "./RitualCombobox";
import { NEXT_LINK, SKIP_LINK, UNDERLINE_INPUT } from "./ritualStyles";

export interface RitualData {
  date: string;
  time: string | null;
  city: string;
  concern: string;
}

const CONCERNS = ["재물운", "연애운", "직업운", "학업운", "건강운", "대인운", "이동운"];
const STEP_LABELS = ["생년월일", "태어난 시간", "태어난 곳", "관심사"] as const;
const TOTAL_STEPS = STEP_LABELS.length;

function districtsOf(province: string): string[] {
  return PROVINCES.find((p) => p.name === province)?.districts ?? [];
}

// 광역자치단체 목록에 "해외"를 덧붙여, 국내 목록에 없는 곳에서 태어난 사람도
// 막히지 않게 한다. 고르면 두 번째 칸이 목록 대신 자유 입력으로 바뀐다.
function searchProvinces(query: string): string[] {
  const names = filterProvinces(query).map((p) => p.name);
  return matchesQuery(OVERSEAS, [], query) ? [...names, OVERSEAS] : names;
}

interface RitualFormProps {
  onComplete: (data: RitualData) => void;
  /** 지금 몇 번째 단계인지 바깥(히어로)에 알려, 위쪽 문구가 단계에 맞게 바뀌게 한다. */
  onStepChange?: (step: number) => void;
}

export function RitualForm({ onComplete, onStepChange }: RitualFormProps) {
  const [step, setStep] = useState(0);
  const [dateInput, setDateInput] = useState("");
  const [timeInput, setTimeInput] = useState("");
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);
  const [overseasCity, setOverseasCity] = useState("");
  const [isoDate, setIsoDate] = useState("");
  const [finalTime, setFinalTime] = useState<string | null>(null);
  const [error, setError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const firstConcernRef = useRef<HTMLButtonElement>(null);

  const isOverseas = province === OVERSEAS;
  const districts = province && !isOverseas ? districtsOf(province) : [];
  const needsDistrict = districts.length > 0;

  // 단계가 바뀔 때마다 새 입력(또는 마지막 단계의 첫 번째 선택지)으로 포커스를 옮긴다.
  // 키보드 사용자가 단계마다 Tab을 눌러 찾아갈 필요가 없게 하기 위함.
  // 2단계(태어난 곳)는 RitualCombobox가 autoFocus로 스스로 처리한다.
  useEffect(() => {
    if (step === 3) firstConcernRef.current?.focus();
    else if (step !== 2) inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

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
      setError("시:분 형식으로 입력해 주세요 (예: 21 : 44)");
      return;
    }
    setFinalTime(parsed.value);
    goToStep(2);
  };

  const skipTime = () => {
    setFinalTime(null);
    goToStep(2);
  };

  const submitPlace = () => {
    if (!province) {
      setError("태어난 광역시·도를 골라 주세요");
      return;
    }
    if (isOverseas && overseasCity.trim() === "") {
      setError("태어난 도시를 적어 주세요");
      return;
    }
    if (needsDistrict && !district) {
      setError("태어난 시·군·구를 골라 주세요");
      return;
    }
    goToStep(3);
  };

  const finalPlace = () => {
    if (isOverseas) return overseasCity.trim();
    return formatPlace(province ?? "", district);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) submitDate();
    else if (step === 1) submitTime();
    else if (step === 2) submitPlace();
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
                setDateInput(formatDateInput(e.target.value, dateInput));
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
                setTimeInput(formatTimeInput(e.target.value, timeInput));
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
            {/* 관공서 양식과 같은 순서: 광역시·도를 먼저 고르고 나서야 그 아래
                시·군·구 칸이 나타난다. 세종처럼 하위 구역이 없는 곳을 고르면
                두 번째 칸은 아예 나타나지 않는다. */}
            <RitualCombobox
              label="태어난 광역시·도"
              placeholder="광역시 · 도"
              value={province}
              autoFocus
              search={searchProvinces}
              onSelect={(next) => {
                setProvince(next);
                setDistrict(null);
                setOverseasCity("");
                clearErrorOnChange();
              }}
            />

            {isOverseas && (
              <div className="mt-6">
                <label htmlFor="ritual-overseas" className="sr-only">
                  태어난 도시
                </label>
                <input
                  id="ritual-overseas"
                  name="overseasCity"
                  type="text"
                  autoComplete="off"
                  enterKeyHint="next"
                  placeholder="도시 이름"
                  className={UNDERLINE_INPUT}
                  value={overseasCity}
                  onChange={(e) => {
                    setOverseasCity(e.target.value);
                    clearErrorOnChange();
                  }}
                />
              </div>
            )}

            {needsDistrict && (
              <div className="mt-6">
                <RitualCombobox
                  label="태어난 시·군·구"
                  placeholder="시 · 군 · 구"
                  value={district}
                  search={(q) => filterDistricts(province!, q)}
                  onSelect={(next) => {
                    setDistrict(next);
                    clearErrorOnChange();
                  }}
                />
              </div>
            )}

            <button type="submit" className={`mt-6 ${NEXT_LINK}`}>
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
                  onComplete({
                    date: isoDate,
                    time: finalTime,
                    city: finalPlace(),
                    concern: c,
                  })
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
