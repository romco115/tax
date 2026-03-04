import { useState, useEffect, useCallback } from "react";
import type {
  QuestionDefinition,
  FormAnswers,
  PartsApplicable,
  FilerIdentification,
  PartITransfer,
  PartIIOwnership,
  PartIIIDistribution,
  PartIVGifts,
} from "../types/form3520";
import { api } from "../api/client";
import ProgressBar from "./ProgressBar";
import QuestionCard from "./QuestionCard";
import PartRouter from "./PartRouter";
import ReviewSummary from "./ReviewSummary";
import CompletePage from "./CompletePage";

type Phase = "loading" | "error" | "interview" | "part-router" | "review" | "complete";
type Direction = "forward" | "backward";

const PART_LABELS: Record<string, string> = {
  identification: "Your Information",
  routing: "About Your Situation",
  I: "Part I — Transfers to Foreign Trusts",
  II: "Part II — Foreign Trust Ownership",
  III: "Part III — Distributions",
  IV: "Part IV — Foreign Gifts & Bequests",
};

function buildFormAnswers(
  answers: Record<string, unknown>,
  partsApplicable: PartsApplicable,
): FormAnswers {
  const ident: FilerIdentification = {
    taxpayer_name: String(answers["taxpayer_name"] ?? ""),
    taxpayer_tin: String(answers["taxpayer_tin"] ?? ""),
    taxpayer_address: String(answers["taxpayer_address"] ?? ""),
    taxpayer_city_state_zip: String(answers["taxpayer_city_state_zip"] ?? ""),
    tax_year: Number(answers["tax_year"] ?? 0),
    filer_type: (answers["filer_type"] as FilerIdentification["filer_type"]) ?? "Individual",
    is_amended: (answers["is_amended"] as "yes" | "no") ?? "no",
  };

  const partITransfers = partsApplicable.part_i
    ? (answers["part_i_transfers"] as PartITransfer[] | undefined) ?? []
    : [];
  const partIIOwn = partsApplicable.part_ii
    ? (answers["part_ii_ownerships"] as PartIIOwnership[] | undefined) ?? []
    : [];
  const partIIIDist = partsApplicable.part_iii
    ? (answers["part_iii_distributions"] as PartIIIDistribution[] | undefined) ?? []
    : [];
  const partIVGifts: PartIVGifts | null = partsApplicable.part_iv
    ? {
        p4_from_individual: (answers["p4_from_individual"] as PartIVGifts["p4_from_individual"]) ?? "no",
        p4_individual_total: answers["p4_individual_total"] as number | undefined,
        p4_from_corp: (answers["p4_from_corp"] as PartIVGifts["p4_from_corp"]) ?? "no",
        p4_corp_total: answers["p4_corp_total"] as number | undefined,
        p4_gifts: (answers["p4_gifts"] as PartIVGifts["p4_gifts"]) ?? [],
      }
    : null;

  return {
    identification: ident,
    parts_applicable: partsApplicable,
    part_i_transfers: partITransfers,
    part_ii_ownerships: partIIOwn,
    part_iii_distributions: partIIIDist,
    part_iv_gifts: partIVGifts,
  };
}

const Interview: React.FC = () => {
  const [allQuestions, setAllQuestions] = useState<QuestionDefinition[]>([]);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [partsApplicable, setPartsApplicable] = useState<PartsApplicable>({
    part_i: false,
    part_ii: false,
    part_iii: false,
    part_iv: false,
  });
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [direction, setDirection] = useState<Direction>("forward");
  const [sessionWarnings, setSessionWarnings] = useState<string[]>([]);
  const [phase, setPhase] = useState<Phase>("loading");
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getQuestions()
      .then((qs) => {
        setAllQuestions(qs);
        setPhase("interview");
      })
      .catch(() => setPhase("error"));
  }, []);

  const activeQuestions = allQuestions.filter((q) => {
    if (q.part === "identification" || q.part === "routing") return true;
    if (q.part === "I") return partsApplicable.part_i;
    if (q.part === "II") return partsApplicable.part_ii;
    if (q.part === "III") return partsApplicable.part_iii;
    if (q.part === "IV") return partsApplicable.part_iv;
    return false;
  });

  const routingQuestions = allQuestions.filter((q) => q.part === "routing");
  const lastRoutingIdx = activeQuestions.findIndex(
    (q) => q.id === routingQuestions[routingQuestions.length - 1]?.id,
  );

  const currentQuestion = activeQuestions[stepIndex];

  const handleAnswer = useCallback(
    (value: unknown) => {
      if (!currentQuestion) return;
      const newAnswers = { ...answers, [currentQuestion.id]: value };
      setAnswers(newAnswers);

      if (currentQuestion.part === "routing" && currentQuestion.triggers_part) {
        const triggered = value === "yes";
        setPartsApplicable((prev) => {
          const key = `part_${currentQuestion.triggers_part!.toLowerCase()}` as keyof PartsApplicable;
          return { ...prev, [key]: triggered };
        });
      }

      if (currentQuestion.type !== "repeating") {
        api
          .validate(currentQuestion.id, value)
          .then((result) => {
            if (result.warnings.length > 0) {
              setSessionWarnings((prev) => [...prev, ...result.warnings]);
            }
          })
          .catch(() => {});
      }
    },
    [currentQuestion, answers],
  );

  const handleNext = useCallback(() => {
    const isLastRouting = stepIndex === lastRoutingIdx;
    const isLastStep = stepIndex >= activeQuestions.length - 1;

    if (isLastRouting && lastRoutingIdx >= 0) {
      setDirection("forward");
      setPhase("part-router");
      return;
    }

    if (isLastStep) {
      setDirection("forward");
      setPhase("review");
      return;
    }

    setDirection("forward");
    setStepIndex((i) => i + 1);
  }, [stepIndex, lastRoutingIdx, activeQuestions.length]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) {
      setDirection("backward");
      setStepIndex((i) => i - 1);
    }
  }, [stepIndex]);

  const handlePartRouterBegin = useCallback(() => {
    const firstPartIdx = activeQuestions.findIndex((q) =>
      ["I", "II", "III", "IV"].includes(q.part),
    );
    if (firstPartIdx >= 0) {
      setDirection("forward");
      setStepIndex(firstPartIdx);
      setPhase("interview");
    } else {
      setPhase("review");
    }
  }, [activeQuestions]);

  const handleEdit = useCallback(
    (partId: string) => {
      const targetPart =
        partId === "identification"
          ? "identification"
          : partId === "routing"
            ? "routing"
            : (partId as QuestionDefinition["part"]);

      const idx = activeQuestions.findIndex((q) => q.part === targetPart);
      if (idx >= 0) {
        setDirection("backward");
        setStepIndex(idx);
        setPhase("interview");
      }
    },
    [activeQuestions],
  );

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const formAnswers = buildFormAnswers(answers, partsApplicable);
      const blob = await api.generatePdf(formAnswers);
      setPdfBlob(blob);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const rawName = String(answers["taxpayer_name"] || "client").trim();
      const safeName = rawName.replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
      const today = new Date().toISOString().split("T")[0];
      a.download = `Form3520_${safeName}_${today}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      setPhase("complete");
    } catch (e) {
      setGenerateError("PDF generation failed. Please try again.");
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  }, [answers, partsApplicable]);

  const handleRestart = useCallback(() => {
    setAnswers({});
    setPartsApplicable({ part_i: false, part_ii: false, part_iii: false, part_iv: false });
    setStepIndex(0);
    setDirection("forward");
    setSessionWarnings([]);
    setPdfBlob(null);
    setGenerateError(null);
    setPhase("interview");
  }, []);

  /* ── Loading ── */
  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Loading your interview…</p>
        </div>
      </div>
    );
  }

  /* ── Error ── */
  if (phase === "error") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-10 text-center animate-fade-up">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-gray-900 font-semibold mb-1.5">Could not connect</p>
          <p className="text-gray-500 text-sm mb-6">
            Make sure the backend is running at http://localhost:8000
          </p>
          <button
            onClick={() => {
              setPhase("loading");
              api
                .getQuestions()
                .then((qs) => { setAllQuestions(qs); setPhase("interview"); })
                .catch(() => setPhase("error"));
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  /* ── Part Router ── */
  if (phase === "part-router") {
    return (
      <div className="min-h-screen bg-slate-50 pt-4">
        <div className="animate-fade-up">
          <PartRouter partsApplicable={partsApplicable} onBegin={handlePartRouterBegin} />
        </div>
      </div>
    );
  }

  /* ── Review ── */
  if (phase === "review") {
    const formAnswers = buildFormAnswers(answers, partsApplicable);
    return (
      <div className="min-h-screen bg-slate-50 pt-4">
        {generateError && (
          <div className="max-w-2xl mx-auto px-4 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {generateError}
            </div>
          </div>
        )}
        <div className="animate-fade-up">
          <ReviewSummary
            answers={formAnswers}
            warnings={sessionWarnings}
            onEdit={handleEdit}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
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
      />
    );
  }

  /* ── Interview ── */
  if (!currentQuestion) return null;

  const partLabel = PART_LABELS[currentQuestion.part] ?? `Part ${currentQuestion.part}`;
  const totalSteps = activeQuestions.length;

  return (
    <div className="min-h-screen bg-slate-50 pt-16 pb-10 px-4">
      <ProgressBar current={stepIndex + 1} total={totalSteps} partLabel={partLabel} />
      {/* key on wrapper triggers slide animation whenever step changes */}
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

export default Interview;
