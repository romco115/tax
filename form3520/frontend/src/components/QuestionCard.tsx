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

const LABEL_CLS = "block text-sm font-medium text-gray-700 mb-1";
const INPUT_CLS =
  "w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900";
const SELECT_CLS =
  "w-full h-11 px-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white";

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

function isoToDisplay(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${m}/${d}/${y}`;
}

function displayToIso(display: string): string {
  const parts = display.split("/");
  if (parts.length !== 3) return display;
  const [m, d, y] = parts;
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
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
  const [dateDisplay, setDateDisplay] = useState<string>(
    fieldDef.type === "date" ? isoToDisplay(String(value ?? "")) : ""
  );

  if (fieldDef.type === "yesno") {
    const current = value as string | undefined;
    return (
      <div className="flex gap-4">
        {["yes", "no"].map((opt) => (
          <label
            key={opt}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border cursor-pointer transition-colors ${
              current === opt
                ? "border-blue-600 bg-blue-50 text-blue-700 font-medium"
                : "border-gray-300 hover:border-blue-400 text-gray-700"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={current === opt}
              onChange={() => onChange(opt)}
            />
            {opt === "yes" ? "Yes" : "No"}
          </label>
        ))}
      </div>
    );
  }

  if (fieldDef.type === "select") {
    return (
      <select
        id={id}
        className={SELECT_CLS}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">— Select —</option>
        {(fieldDef.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (fieldDef.type === "currency") {
    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
        <input
          id={id}
          type="text"
          className={`${INPUT_CLS} pl-7`}
          value={currencyDisplay}
          onChange={(e) => {
            setCurrencyDisplay(e.target.value);
            const n = parseCurrencyInput(e.target.value);
            onChange(n === "" ? undefined : n);
          }}
          onBlur={() => {
            const n = parseCurrencyInput(currencyDisplay);
            if (n !== "") {
              setCurrencyDisplay(formatCurrencyDisplay(n));
            }
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
        type="text"
        className={INPUT_CLS}
        value={dateDisplay}
        placeholder="MM/DD/YYYY"
        onChange={(e) => {
          setDateDisplay(e.target.value);
          if (e.target.value.length === 10) {
            onChange(displayToIso(e.target.value));
          }
        }}
        onBlur={() => {
          const iso = displayToIso(dateDisplay);
          if (iso !== dateDisplay) {
            setDateDisplay(isoToDisplay(iso));
            onChange(iso);
          }
        }}
        maxLength={10}
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
    <div className="space-y-6">
      {entries.map((entry, idx) => (
        <div key={idx} className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Entry {idx + 1}</span>
            {entries.length > 1 && (
              <button
                type="button"
                onClick={() => removeEntry(idx)}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                Remove
              </button>
            )}
          </div>
          {fields.map((f) => (
            <div key={f.id}>
              <label className={LABEL_CLS}>
                {f.label}
                {f.required && <span className="text-red-500 ml-0.5">*</span>}
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
        className="text-blue-600 hover:text-blue-800 text-sm font-medium border border-blue-300 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
      >
        + Add another entry
      </button>
    </div>
  );
}

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

  // Clear errors when navigating to a new question
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

  const handleNext = async () => {
    const ok = await validate();
    if (ok) onNext();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md p-8 transition-all duration-300">
      <div className="mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          {question.part === "identification"
            ? "Your Information"
            : question.part === "routing"
              ? "About Your Situation"
              : `Part ${question.part}`}
        </p>
        <h2 className="text-xl font-semibold text-gray-900 leading-snug">{question.label}</h2>
        {question.help_text && (
          <p className="text-sm text-gray-500 mt-2">{question.help_text}</p>
        )}
      </div>

      <div className="mb-6">
        {question.type === "repeating" ? (
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

      {errors.length > 0 && (
        <div className="mb-4 space-y-1">
          {errors.map((e, i) => (
            <p key={i} className="text-red-600 text-sm">
              {e}
            </p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-yellow-700 text-sm">
              {w}
            </p>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className={`text-blue-600 hover:underline text-sm ${isFirst ? "invisible" : ""}`}
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={validating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          {validating ? "Checking..." : "Next →"}
        </button>
      </div>
    </div>
  );
};

export default QuestionCard;
