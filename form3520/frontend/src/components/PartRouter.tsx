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
  color: string;
}

const PART_INFO: PartInfo[] = [
  {
    key: "part_i",
    number: "I",
    title: "Transfers to Foreign Trusts",
    description: "You transferred money or property to a foreign trust.",
    color: "bg-blue-600",
  },
  {
    key: "part_ii",
    number: "II",
    title: "U.S. Owner of a Foreign Trust",
    description: "You owned or were treated as owning part of a foreign trust.",
    color: "bg-indigo-600",
  },
  {
    key: "part_iii",
    number: "III",
    title: "Distributions from Foreign Trusts",
    description: "You received distributions from a foreign trust.",
    color: "bg-violet-600",
  },
  {
    key: "part_iv",
    number: "IV",
    title: "Foreign Gifts & Bequests",
    description: "You received large gifts or bequests from a foreign person.",
    color: "bg-purple-600",
  },
];

const PartRouter: React.FC<PartRouterProps> = ({ partsApplicable, onBegin }) => {
  const applicable = PART_INFO.filter((p) => partsApplicable[p.key]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 p-8 mb-6 animate-fade-up text-center">
        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">Next Up</p>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {applicable.length === 0 ? "All done with routing!" : `${applicable.length} section${applicable.length !== 1 ? "s" : ""} to complete`}
        </h2>
        <p className="text-gray-500 text-sm">
          {applicable.length === 0
            ? "No additional parts are required based on your answers."
            : "Based on your answers, we need a bit more information for the following parts of Form 3520."}
        </p>
      </div>

      {/* Part cards */}
      {applicable.length > 0 && (
        <div className="space-y-3 mb-8">
          {applicable.map((part, i) => (
            <div
              key={part.key}
              className="bg-white rounded-xl shadow-sm ring-1 ring-gray-100 p-5 flex items-start gap-4 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`w-10 h-10 rounded-xl ${part.color} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
                {part.number}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-sm">{part.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{part.description}</p>
              </div>
              <svg className="w-4 h-4 text-gray-300 ml-auto mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          ))}
        </div>
      )}

      <div className="text-center animate-fade-up" style={{ animationDelay: `${applicable.length * 80 + 80}ms` }}>
        <button
          onClick={onBegin}
          className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 shadow-lg shadow-blue-200/60"
        >
          {applicable.length === 0 ? "Go to Review" : "Let's begin"}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PartRouter;
