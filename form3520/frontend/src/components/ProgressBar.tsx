interface ProgressBarProps {
  current: number;
  total: number;
  partLabel: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, partLabel }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="h-1 bg-blue-600 transition-all duration-300" style={{ width: `${pct}%` }} />
      <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between text-sm text-gray-600">
        <span className="font-medium text-blue-600">{partLabel}</span>
        <span>
          Step {current} of {total}
        </span>
      </div>
    </div>
  );
};

export default ProgressBar;
