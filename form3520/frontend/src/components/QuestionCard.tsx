import { useState, useCallback, useEffect } from "react";
import type { QuestionDefinition, RepeatingFieldDef } from "../types/form3520";
import { api } from "../api/client";

interface QuestionCardProps {
  question: QuestionDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
}

const INPUT_CLS =
  "w-full h-12 px-4 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-all duration-150 text-[15px]";
const SELECT_CLS =
  "w-full h-12 px-4 pr-10 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 text-gray-900 transition-all duration-150 text-[15px] appearance-none cursor-pointer";
const LABEL_CLS = "block text-sm font-medium text-gray-500 mb-1.5";

function formatCurrencyDisplay(raw: number | string | undefined): string {
  if (raw === undefined || raw === "" || raw === null) return "";
  const n = typeof raw === "number" ? raw : parseFloat(String(raw).replace(/,/g, ""));
  if (isNaN(n)) return String(raw);
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function parseCurrencyInput(s: string): number | "" {
  const cleaned = s.replace(/[$,]/g, "").trim();
  if (!cleaned) return "";
  const n = parseFloat(cleaned);
  return isNaN(n) ? "" : n;
}


interface SingleFieldProps {
  fieldDef: Pick<QuestionDefinition, "type" | "options">;
  value: unknown;
  onChange: (v: unknown) => void;
  id?: string;
}

function SingleInput({ fieldDef, value, onChange, id }: SingleFieldProps) {
  const [currencyDisplay, setCurrencyDisplay] = useState<string>(
    fieldDef.type === "currency" ? formatCurrencyDisplay(value as number) : ""
  );

  if (fieldDef.type === "yesno") {
    const current = value as string | undefined;
    return (
      <div className="flex gap-3">
        {(["yes", "no"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`flex-1 py-4 px-5 rounded-xl border-2 font-semibold text-base flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-150 select-none ${
              current === opt
                ? opt === "yes"
                  ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200/60"
                  : "border-gray-800 bg-gray-900 text-white shadow-lg shadow-gray-300/40"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 active:scale-[0.97]"
            }`}
          >
            {current === opt && (
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
            {opt === "yes" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    );
  }

  if (fieldDef.type === "select") {
    return (
      <div className="relative">
        <select
          id={id}
          className={SELECT_CLS}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">— Select —</option>
          {(fieldDef.options ?? []).map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }

  if (fieldDef.type === "currency") {
    return (
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium pointer-events-none">$</span>
        <input
          id={id}
          type="text"
          className={`${INPUT_CLS} pl-8`}
          value={currencyDisplay}
          onChange={(e) => {
            setCurrencyDisplay(e.target.value);
            const n = parseCurrencyInput(e.target.value);
            onChange(n === "" ? undefined : n);
          }}
          onBlur={() => {
            const n = parseCurrencyInput(currencyDisplay);
            if (n !== "") setCurrencyDisplay(formatCurrencyDisplay(n));
          }}
          placeholder="0.00"
          inputMode="decimal"
        />
      </div>
    );
  }

  if (fieldDef.type === "date") {
    return (
      <input
        id={id}
        type="date"
        className={INPUT_CLS}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (fieldDef.type === "number") {
    return (
      <input
        id={id}
        type="number"
        className={INPUT_CLS}
        value={value === undefined || value === null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    );
  }

  return (
    <input
      id={id}
      type="text"
      className={INPUT_CLS}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function parseCityStateZip(combined: string): { city: string; state: string; zip: string } {
  const match = combined.match(/^(.*),\s*([A-Za-z]{2})\s+(\S+)$/);
  if (match) return { city: match[1].trim(), state: match[2], zip: match[3] };
  return { city: combined, state: "", zip: "" };
}

function CityStateZipInput({ value, onChange }: { value: unknown; onChange: (v: unknown) => void }) {
  const parsed = parseCityStateZip(String(value ?? ""));
  const [city, setCity] = useState(parsed.city);
  const [st, setSt] = useState(parsed.state);
  const [zip, setZip] = useState(parsed.zip);

  const emit = (c: string, s: string, z: string) => {
    onChange(c || s || z ? `${c}, ${s} ${z}` : "");
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      <div className="col-span-3">
        <label className={LABEL_CLS}>City</label>
        <input
          type="text"
          className={INPUT_CLS}
          value={city}
          placeholder="San Francisco"
          onChange={(e) => { setCity(e.target.value); emit(e.target.value, st, zip); }}
        />
      </div>
      <div className="col-span-1">
        <label className={LABEL_CLS}>State</label>
        <input
          type="text"
          className={INPUT_CLS}
          value={st}
          placeholder="CA"
          maxLength={2}
          onChange={(e) => { const v = e.target.value.toUpperCase(); setSt(v); emit(city, v, zip); }}
        />
      </div>
      <div className="col-span-1">
        <label className={LABEL_CLS}>ZIP</label>
        <input
          type="text"
          className={INPUT_CLS}
          value={zip}
          placeholder="94105"
          maxLength={10}
          inputMode="numeric"
          onChange={(e) => { setZip(e.target.value); emit(city, st, e.target.value); }}
        />
      </div>
    </div>
  );
}

type RepeatingEntry = Record<string, unknown>;

interface RepeatingGroupProps {
  fields: RepeatingFieldDef[];
  value: RepeatingEntry[];
  onChange: (entries: RepeatingEntry[]) => void;
}

function RepeatingGroup({ fields, value, onChange }: RepeatingGroupProps) {
  const entries: RepeatingEntry[] = Array.isArray(value) && value.length > 0 ? value : [{}];

  const updateEntry = (idx: number, fieldId: string, v: unknown) => {
    const updated = entries.map((e, i) => (i === idx ? { ...e, [fieldId]: v } : e));
    onChange(updated);
  };

  const addEntry = () => onChange([...entries, {}]);
  const removeEntry = (idx: number) => {
    if (entries.length <= 1) return;
    onChange(entries.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-5">
      {entries.map((entry, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/60">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Entry {idx + 1}
            </span>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-red-400 hover:text-red-600 text-xs font-medium transition-colors"
              >
                Remove
              </button>
            )}
          </div>
          {fields.map((f) => (
            <div key={f.id}>
              <label className={LABEL_CLS}>
                {f.label}
                {f.required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <SingleInput
                fieldDef={f}
                value={entry[f.id]}
                onChange={(v) => updateEntry(idx, f.id, v)}
              />
            </div>
          ))}
        </div>
      ))}
      <button
        type="button"
        onClick={addEntry}
        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 text-sm font-medium border border-blue-200 hover:border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add another entry
      </button>
    </div>
  );
}

const PART_BADGES: Record<string, string> = {
  identification: "Your Information",
  routing: "About Your Situation",
  I: "Part I",
  II: "Part II",
  III: "Part III",
  IV: "Part IV",
};

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  value,
  onChange,
  onNext,
  onBack,
  isFirst,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    setErrors([]);
    setWarnings([]);
  }, [question.id]);

  const validate = useCallback(async () => {
    if (question.type === "repeating") return true;
    setValidating(true);
    try {
      const result = await api.validate(question.id, value);
      setErrors(result.errors);
      setWarnings(result.warnings);
      return result.valid;
    } catch {
      return true;
    } finally {
      setValidating(false);
    }
  }, [question.id, question.type, value]);

  const handleNext = useCallback(async () => {
    const ok = await validate();
    if (ok) onNext();
  }, [validate, onNext]);

  // Enter key → advance (except for repeating groups)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (question.type === "repeating") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA") return;
      e.preventDefault();
      void handleNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [question.type, handleNext]);

  const partBadge = PART_BADGES[question.part] ?? `Part ${question.part}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1" style={{ background: "linear-gradient(90deg, #3b82f6, #6366f1)" }} />

        <div className="p-8 sm:p-10">
          {/* Part badge */}
          <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">
            {partBadge}
          </p>

          {/* Question text */}
          <h2 className="text-[22px] font-semibold text-gray-900 leading-snug mb-2">
            {question.label}
          </h2>
          {question.help_text && (
            <p className="text-sm text-gray-500 leading-relaxed mb-7">{question.help_text}</p>
          )}
          {!question.help_text && <div className="mb-6" />}

          {/* Input */}
          <div className="mb-6">
            {question.id === "taxpayer_city_state_zip" ? (
              <CityStateZipInput value={value} onChange={onChange} />
            ) : question.type === "repeating" ? (
              <RepeatingGroup
                fields={question.fields ?? []}
                value={Array.isArray(value) ? (value as RepeatingEntry[]) : []}
                onChange={onChange}
              />
            ) : (
              <SingleInput
                fieldDef={question}
                value={value}
                onChange={onChange}
                id={question.id}
              />
            )}
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="mb-4 flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="space-y-0.5">
                {errors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
              </div>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="mb-4 flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
              <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="space-y-0.5">
                {warnings.map((w, i) => <p key={i} className="text-sm text-amber-700">{w}</p>)}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onBack}
              disabled={isFirst}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isFirst ? "invisible" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="flex items-center gap-3">
              {question.type !== "repeating" && (
                <span className="text-xs text-gray-300 hidden sm:block select-none">Enter ↵</span>
              )}
              <button
                type="button"
                onClick={() => { void handleNext(); }}
                disabled={validating}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  validating
                    ? "bg-blue-300 text-white cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700 active:scale-[0.97] text-white shadow-sm hover:shadow-md"
                }`}
              >
                {validating ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Checking…
                  </>
                ) : (
                  <>
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;
