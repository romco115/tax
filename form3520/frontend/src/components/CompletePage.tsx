interface CompletePageProps {
  pdfBlob: Blob;
  sessionWarnings: string[];
  onRestart: () => void;
  formLabel?: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CompletePage: React.FC<CompletePageProps> = ({ pdfBlob, sessionWarnings, onRestart, formLabel = "Form 3520" }) => {
  const uniqueWarnings = [...new Set(sessionWarnings)];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col items-center justify-start pt-12 px-4 pb-16">
      {/* Success card */}
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl ring-1 ring-green-100 p-10 text-center mb-6 animate-bounce-in">
        {/* Animated checkmark */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse-ring opacity-60" />
          <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-200/60">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">{formLabel} Generated!</h2>
        <p className="text-gray-500 text-sm mb-7 leading-relaxed">
          Your completed PDF has been downloaded automatically.
          Check your <strong className="text-gray-700">Downloads</strong> folder.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => downloadBlob(pdfBlob, "form3520_filled.pdf")}
            className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-[0.98] text-white font-semibold px-6 py-3 rounded-xl transition-all duration-150 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Again
          </button>
        </div>
      </div>

      {/* IRS warnings */}
      {uniqueWarnings.length > 0 && (
        <div className="max-w-lg w-full bg-amber-50 border border-amber-200 rounded-xl p-5 mb-4 animate-fade-up">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-4 h-4 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold text-amber-800 text-sm">IRS Notices from Your Interview</p>
          </div>
          <ul className="space-y-1.5">
            {uniqueWarnings.map((w, i) => (
              <li key={i} className="text-amber-700 text-sm flex gap-2">
                <span className="flex-shrink-0 mt-0.5">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Disclaimer */}
      <div className="max-w-lg w-full bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6 animate-fade-up">
        <p className="text-gray-500 text-xs leading-relaxed">
          <strong className="text-gray-700">Disclaimer:</strong> This tool helps organize your
          information for IRS Form 3520. It is not legal or tax advice. Review the completed form
          carefully and consult a qualified tax professional before filing. Penalties for incorrect
          or late filing can be severe.
        </p>
      </div>

      <button
        onClick={onRestart}
        className="text-sm text-gray-400 hover:text-blue-600 transition-colors animate-fade-up"
      >
        Start a new {formLabel}
      </button>
    </div>
  );
};

export default CompletePage;
