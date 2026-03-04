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

  // Active question list = identification + routing + applicable Part questions
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

      // Update parts applicable from routing answers
      if (currentQuestion.part === "routing" && currentQuestion.triggers_part) {
        const triggered = value === "yes";
        setPartsApplicable((prev) => {
          const key = `part_${currentQuestion.triggers_part!.toLowerCase()}` as keyof PartsApplicable;
          return { ...prev, [key]: triggered };
        });
      }

      // Collect warnings from validate
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
      setPhase("part-router");
      return;
    }

    if (isLastStep) {
      setPhase("review");
      return;
    }

    setStepIndex((i) => i + 1);
  }, [stepIndex, lastRoutingIdx, activeQuestions.length]);

  const handleBack = useCallback(() => {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }, [stepIndex]);

  const handlePartRouterBegin = useCallback(() => {
    // Jump to first Part question after routing
    const firstPartIdx = activeQuestions.findIndex((q) =>
      ["I", "II", "III", "IV"].includes(q.part),
    );
    if (firstPartIdx >= 0) {
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

      // Auto-download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "form3520_filled.pdf";
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
    setSessionWarnings([]);
    setPdfBlob(null);
    setGenerateError(null);
    setPhase("interview");
  }, []);

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-gray-600 text-sm">Loading questions…</p>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <p className="text-red-600 font-semibold mb-2">Could not connect to the server</p>
          <p className="text-gray-600 text-sm mb-5">
            Make sure the backend is running at http://localhost:8001
          </p>
          <button
            onClick={() => {
              setPhase("loading");
              api
                .getQuestions()
                .then((qs) => {
                  setAllQuestions(qs);
                  setPhase("interview");
                })
                .catch(() => setPhase("error"));
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (phase === "part-router") {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <PartRouter partsApplicable={partsApplicable} onBegin={handlePartRouterBegin} />
      </div>
    );
  }

  if (phase === "review") {
    const formAnswers = buildFormAnswers(answers, partsApplicable);
    return (
      <div className="min-h-screen bg-gray-50 pt-4">
        {generateError && (
          <div className="max-w-2xl mx-auto px-4 mb-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
              {generateError}
            </div>
          </div>
        )}
        <ReviewSummary
          answers={formAnswers}
          warnings={sessionWarnings}
          onEdit={handleEdit}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />
      </div>
    );
  }

  if (phase === "complete" && pdfBlob) {
    return (
      <div className="min-h-screen bg-gray-50">
        <CompletePage
          pdfBlob={pdfBlob}
          sessionWarnings={sessionWarnings}
          onRestart={handleRestart}
        />
      </div>
    );
  }

  // Interview phase
  if (!currentQuestion) {
    return null;
  }

  const partLabel = PART_LABELS[currentQuestion.part] ?? `Part ${currentQuestion.part}`;
  const totalSteps = activeQuestions.length;

  return (
    <div className="min-h-screen bg-gray-50 pt-16 pb-8 px-4">
      <ProgressBar current={stepIndex + 1} total={totalSteps} partLabel={partLabel} />
      <div className="mt-8">
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
