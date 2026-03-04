interface CompletePageProps {
  pdfBlob: Blob;
  sessionWarnings: string[];
  onRestart: () => void;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const CompletePage: React.FC<CompletePageProps> = ({ pdfBlob, sessionWarnings, onRestart }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 mb-6 text-center">
        <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-green-800 mb-2">Form 3520 Generated!</h2>
        <p className="text-green-700 text-sm mb-5">
          Your completed Form 3520 PDF has been downloaded. Check your Downloads folder.
        </p>
        <button
          onClick={() => downloadBlob(pdfBlob, "form3520_filled.pdf")}
          className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Download Again
        </button>
      </div>

      {sessionWarnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <p className="font-semibold text-yellow-800 text-sm mb-3">
            IRS Notices from Your Interview
          </p>
          <ul className="space-y-2">
            {[...new Set(sessionWarnings)].map((w, i) => (
              <li key={i} className="text-yellow-700 text-sm flex gap-2">
                <span className="flex-shrink-0">•</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          <strong className="text-gray-700">Disclaimer:</strong> This tool helps organize your
          information for IRS Form 3520. It is not legal or tax advice. Review the completed form
          carefully and consult a qualified tax professional before filing with the IRS. Penalties
          for incorrect or late filing of Form 3520 can be severe. The IRS instructions for Form
          3520 are available at{" "}
          <span className="text-blue-600">www.irs.gov/Form3520</span>.
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onRestart}
          className="text-blue-600 hover:underline text-sm"
        >
          Start a new Form 3520
        </button>
      </div>
    </div>
  );
};

export default CompletePage;
