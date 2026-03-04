import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { QuestionDefinition, ValidationResult } from "../types/form3520";
import type { ExtractedIdData } from "../types/w7";
import { api } from "../api/client";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import IdUploadCard from "./IdUploadCard";
import CompletePage from "./CompletePage";

type Phase = "loading" | "error" | "id-upload" | "interview" | "review" | "complete";
type Direction = "forward" | "backward";

const PART_LABELS: Record<string, string> = {
  identification: "W-7 — ITIN Application",
};

/** Map extracted ID data to initial W7 answers. */
function mapExtractedToAnswers(data: ExtractedIdData): Record<string, unknown> {
  const ans: Record<string, unknown> = {};
  if (data.first_name)  ans["first_name"]  = data.first_name;
  if (data.last_name)   ans["last_name"]   = data.last_name;
  if (data.dob)         ans["dob"]         = data.dob;
  if (data.doc_number)  ans["doc_number"]  = data.doc_number;
  if (data.doc_expiry)  ans["doc_expiry"]  = data.doc_expiry;
  if (data.doc_type)    ans["doc_type"]    = data.doc_type;
  if (data.issued_by)   ans["doc_issued_by"] = data.issued_by;
  if (data.country) {
    ans["country_of_birth"]   = data.country;
    ans["country_citizenship"] = data.country;
  }
  if (data.sex)       ans["sex"]       = data.sex;
  return ans;
}

const W7Interview: React.FC = () => {
  const navigate = useNavigate();

  const [allQuestions, setAllQuestions]   = useState<QuestionDefinition[]>([]);
  const [answers, setAnswers]             = useState<Record<string, unknown>>({});
  const [stepIndex, setStepIndex]         = useState(0);
  const [direction, setDirection]         = useState<Direction>("forward");
  const [sessionWarnings, setSessionWarnings] = useState<string[]>([]);
  const [phase, setPhase]                 = useState<Phase>("loading");
  const [pdfBlob, setPdfBlob]             = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating]   = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getW7Questions()
      .then((qs) => {
        setAllQuestions(qs);
        setPhase("id-upload");
      })
      .catch(() => setPhase("error"));
  }, []);

  const currentQuestion = allQuestions[stepIndex] as QuestionDefinition | undefined;

  const handleIdConfirm = useCallback((extracted: ExtractedIdData) => {
    setAnswers(mapExtractedToAnswers(extracted));
    setDirection("forward");
    setPhase("interview");
  }, []);

  const handleIdSkip = useCallback(() => {
    setDirection("forward");
    setPhase("interview");
  }, []);

  const handleAnswer = useCallback(
    (value: unknown) => {
      if (!currentQuestion) return;
      setAnswers((prev) => ({ ...prev, [currentQuestion.id]: value }));

      if (currentQuestion.type !== "repeating") {
        api
          .validateW7(currentQuestion.id, value)
          .then((result: ValidationResult) => {
            if (result.warnings.length > 0) {
              setSessionWarnings((prev) => [...prev, ...result.warnings]);
            }
          })
          .catch(() => {});
      }
    },
    [currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (stepIndex >= allQuestions.length - 1) {
      setDirection("forward");
      setPhase("review");
      return;
    }
    setDirection("forward");
    setStepIndex((i) => i + 1);
  }, [stepIndex, allQuestions.length]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      setDirection("backward");
      setPhase("id-upload");
      return;
    }
    setDirection("backward");
    setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const blob = await api.generateW7Pdf(answers);
      setPdfBlob(blob);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const first = String(answers["first_name"] || "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const last  = String(answers["last_name"]  || "").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const today = new Date().toISOString().split("T")[0];
      a.download = `FormW7_${first}_${last}_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setPhase("complete");
    } catch {
      setGenerateError("PDF generation failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [answers]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setStepIndex(0);
    setDirection("forward");
    setSessionWarnings([]);
    setPdfBlob(null);
    setGenerateError(null);
    setPhase("id-upload");
  }, []);

  /* ── Loading ── */
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
            <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading W-7 form…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-10 text-center animate-fade-up">
          <p className="text-gray-900 font-semibold mb-1.5">Could not connect</p>
          <p className="text-gray-500 text-sm mb-6">
            Make sure the backend is running at http://localhost:8000
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setPhase("loading");
                api.getW7Questions()
                  .then((qs) => { setAllQuestions(qs); setPhase("id-upload"); })
                  .catch(() => setPhase("error"));
              }}
              className="bg-violet-600 hover:bg-violet-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Try again
            </button>
            <button
              onClick={() => navigate("/")}
              className="border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── ID Upload ── */
  if (phase === "id-upload") {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 pb-10 px-4">
        <ProgressBar current={0} total={allQuestions.length} partLabel="W-7 — Scan your ID" />
        <div className="mt-10 animate-fade-up">
          <IdUploadCard onConfirm={handleIdConfirm} onSkip={handleIdSkip} />
        </div>
      </div>
    );
  }

  /* ── Review ── */
  if (phase === "review") {
    return (
      <div className="min-h-screen bg-slate-50 pt-8 pb-10 px-4">
        <div className="max-w-2xl mx-auto animate-fade-up">
          {generateError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm mb-4">
              {generateError}
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-violet-50 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Review your W-7</h2>
            </div>

            <div className="space-y-3 mb-8">
              {allQuestions.map((q) => {
                const val = answers[q.id];
                if (val === undefined || val === null || val === "") return null;
                return (
                  <div key={q.id} className="flex justify-between gap-4 py-2 border-b border-gray-50 last:border-0 text-sm">
                    <span className="text-gray-500 flex-shrink-0 max-w-[45%] leading-relaxed">{q.label.replace(/\s*\(.*?\)\??/g, "").replace(/\?$/, "")}</span>
                    <span className="text-gray-900 font-medium text-right">{String(val)}</span>
                  </div>
                );
              })}
            </div>

            {sessionWarnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <p className="text-sm font-semibold text-amber-800 mb-2">Notices</p>
                <ul className="space-y-1.5">
                  {[...new Set(sessionWarnings)].map((w, i) => (
                    <li key={i} className="text-amber-700 text-sm">• {w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => { setDirection("backward"); setPhase("interview"); }}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                ← Edit
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-violet-200/60 flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Generating…
                  </>
                ) : (
                  "Generate my Form W-7 →"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Complete ── */
  if (phase === "complete" && pdfBlob) {
    return (
      <CompletePage
        pdfBlob={pdfBlob}
        sessionWarnings={sessionWarnings}
        onRestart={handleRestart}
        formLabel="Form W-7"
      />
    );
  }

  /* ── Interview ── */
  if (!currentQuestion) return null;

  const partLabel = PART_LABELS[currentQuestion.part] ?? "W-7 — ITIN Application";

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-10 px-4">
      <ProgressBar
        current={stepIndex + 1}
        total={allQuestions.length}
        partLabel={partLabel}
      />
      <div
        key={stepIndex}
        className={`mt-10 ${direction === "forward" ? "animate-slide-right" : "animate-slide-left"}`}
      >
        <QuestionCard
          question={currentQuestion}
          value={answers[currentQuestion.id]}
          onChange={handleAnswer}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={stepIndex === 0}
        />
      </div>
    </div>
  );
};

export default W7Interview;
