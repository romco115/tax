import type { PartsApplicable } from "../types/form3520";

interface PartRouterProps {
  partsApplicable: PartsApplicable;
  onBegin: () => void;
}

interface PartInfo {
  key: keyof PartsApplicable;
  number: string;
  title: string;
  description: string;
  questionCount: number;
}

const PART_INFO: PartInfo[] = [
  {
    key: "part_i",
    number: "I",
    title: "Transfers to Foreign Trusts",
    description:
      "You transferred money or property to a foreign trust. We'll collect details about each transfer.",
    questionCount: 9,
  },
  {
    key: "part_ii",
    number: "II",
    title: "U.S. Owner of a Foreign Trust",
    description:
      "You owned or were treated as owning part of a foreign trust. We'll collect ownership details.",
    questionCount: 10,
  },
  {
    key: "part_iii",
    number: "III",
    title: "Distributions from Foreign Trusts",
    description:
      "You received distributions from a foreign trust. We'll collect details about each distribution.",
    questionCount: 7,
  },
  {
    key: "part_iv",
    number: "IV",
    title: "Foreign Gifts & Bequests",
    description:
      "You received large gifts or bequests from a foreign person. We'll collect details about each gift.",
    questionCount: 5,
  },
];

const PartRouter: React.FC<PartRouterProps> = ({ partsApplicable, onBegin }) => {
  const applicable = PART_INFO.filter((p) => partsApplicable[p.key]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
          Next Up
        </p>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Parts that apply to you</h2>
        <p className="text-gray-600 text-sm">
          Based on your answers, you need to complete the following section
          {applicable.length !== 1 ? "s" : ""}:
        </p>
      </div>

      {applicable.length === 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <p className="text-green-700 font-medium">
            No additional parts required. You can proceed to review.
          </p>
        </div>
      )}

      <div className="space-y-4 mb-8">
        {applicable.map((part) => (
          <div key={part.key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                {part.number}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{part.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{part.description}</p>
                <p className="text-xs text-gray-400 mt-2">~{part.questionCount} questions</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={onBegin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-base"
        >
          Begin →
        </button>
      </div>
    </div>
  );
};

export default PartRouter;
