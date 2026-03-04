import { Link } from "react-router-dom";

interface ProgressBarProps {
  current: number;
  total: number;
  partLabel: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, partLabel }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      {/* Thin gradient progress line */}
      <div className="h-[3px] bg-gray-100">
        <div
          className="h-full rounded-r-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3b82f6, #6366f1)" }}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 h-11 flex items-center justify-between gap-4">
        {/* Left: home link + logo + section label */}
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0 mr-1"
            title="Back to home"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-[8px] font-black tracking-tighter leading-none">IRS</span>
          </div>
          <span className="text-sm font-medium text-gray-600 truncate">{partLabel}</span>
        </div>

        {/* Right: step counter + mini bar + percent */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <span className="text-xs text-gray-400 font-medium tabular-nums hidden sm:block">
            {current} / {total}
          </span>
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, background: "linear-gradient(90deg, #3b82f6, #6366f1)" }}
            />
          </div>
          <span className="text-xs font-bold text-blue-600 tabular-nums w-7 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
