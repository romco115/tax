import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "⚡",
    title: "Smart Branching",
    desc: "Only see questions relevant to your situation. Parts that don't apply are skipped automatically.",
  },
  {
    icon: "⚠️",
    title: "IRS Warnings Built In",
    desc: "Real-time alerts for key compliance rules, penalty thresholds, and filing requirements.",
  },
  {
    icon: "📋",
    title: "All 4 Parts Covered",
    desc: "Transfers, ownership, distributions, and foreign gifts — covered in a single interview.",
  },
  {
    icon: "📄",
    title: "Official PDF Output",
    desc: "Downloads the actual IRS Form 3520 (Rev. 12-2023) with your data filled in.",
  },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6 py-3.5">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-[9px] font-black tracking-tighter">IRS</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Form 3520 Interview</span>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-14">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1 text-xs font-semibold mb-6 tracking-wide uppercase">
            U.S. Tax Compliance Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-5 leading-tight tracking-tight">
            IRS Form 3520,<br />
            <span className="text-blue-600">done in minutes</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed mb-8 max-w-lg mx-auto">
            Answer plain-English questions about your foreign trusts and gifts.
            We fill the official IRS PDF and download it instantly.
          </p>
          <button
            onClick={() => navigate("/interview")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-150 text-base shadow-lg shadow-blue-200/60"
          >
            Start your interview
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <p className="text-xs text-gray-400 mt-3">No account needed · Free · Takes ~5 minutes</p>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow duration-200 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="text-2xl mb-2.5">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* What is Form 3520? */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-blue-800 mb-1.5">Who needs to file Form 3520?</p>
          <p className="text-blue-700 text-sm leading-relaxed">
            U.S. persons who transferred assets to a foreign trust, owned or received distributions
            from a foreign trust, or received gifts/bequests over $100,000 from foreign individuals
            (or $16,649+ from foreign corporations/partnerships) during the tax year.
          </p>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-500 text-xs leading-relaxed">
            <strong className="text-gray-600">Disclaimer:</strong> This tool helps organize your
            information for IRS Form 3520. It is not legal or tax advice. Always review the
            completed form and consult a qualified tax professional before filing.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
