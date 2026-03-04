import { useNavigate } from "react-router-dom";

const FORMS = [
  {
    number: "3520",
    title: "Foreign Trust & Gift Reporting",
    desc: "For U.S. persons who transferred assets to a foreign trust, received distributions, own a foreign trust, or received foreign gifts over the threshold.",
    tag: "Foreign Trusts · Gifts · Bequests",
    color: "blue",
    path: "/form/3520",
    badge: "4 parts · ~5 min",
  },
  {
    number: "W-7",
    title: "ITIN Application",
    desc: "Apply for or renew an Individual Taxpayer Identification Number. Upload a photo of your government-issued ID and we'll pre-fill the form automatically.",
    tag: "ITIN · Nonresident Aliens · Dependents",
    color: "violet",
    path: "/form/w7",
    badge: "ID scan · ~3 min",
  },
];

const colorMap: Record<string, { border: string; badge: string; btn: string; accent: string; tag: string }> = {
  blue: {
    border: "hover:border-blue-300",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    btn: "bg-blue-600 hover:bg-blue-700 shadow-blue-200/60",
    accent: "bg-blue-600",
    tag: "text-blue-600",
  },
  violet: {
    border: "hover:border-violet-300",
    badge: "bg-violet-50 text-violet-700 border-violet-100",
    btn: "bg-violet-600 hover:bg-violet-700 shadow-violet-200/60",
    accent: "bg-violet-600",
    tag: "text-violet-600",
  },
};

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm px-6 py-3.5">
        <div className="max-w-3xl mx-auto flex items-center gap-2.5">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white text-[9px] font-black tracking-tighter">IRS</span>
          </div>
          <span className="font-semibold text-gray-900 text-sm">Tax Form Assistant</span>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-14">
        {/* Hero */}
        <div className="text-center mb-12 animate-fade-up">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-4 py-1 text-xs font-semibold mb-6 tracking-wide uppercase">
            U.S. Tax Compliance Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight tracking-tight">
            IRS Forms,<br />
            <span className="text-blue-600">done in minutes</span>
          </h1>
          <p className="text-gray-500 text-lg leading-relaxed max-w-xl mx-auto">
            Answer plain-English questions, attach your ID, and download
            the official IRS PDF — pre-filled with your data.
          </p>
        </div>

        {/* Form cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          {FORMS.map((form, i) => {
            const c = colorMap[form.color];
            return (
              <div
                key={form.number}
                className={`bg-white rounded-2xl border border-gray-100 ${c.border} shadow-sm hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden animate-fade-up`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Color accent bar */}
                <div className={`h-1 ${c.accent}`} />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`text-xs font-bold uppercase tracking-widest ${c.tag}`}>
                        Form {form.number}
                      </span>
                      <h2 className="text-lg font-bold text-gray-900 mt-0.5 leading-snug">
                        {form.title}
                      </h2>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ml-2 flex-shrink-0 ${c.badge}`}>
                      {form.badge}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 leading-relaxed flex-1 mb-5">
                    {form.desc}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{form.tag}</span>
                    <button
                      onClick={() => navigate(form.path)}
                      className={`inline-flex items-center gap-1.5 ${c.btn} active:scale-[0.97] text-white font-semibold px-4 py-2 rounded-lg transition-all duration-150 text-sm shadow-lg`}
                    >
                      Start
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">How it works</p>
          <ol className="text-sm text-gray-500 space-y-1 list-decimal list-inside">
            <li>Select the form you need to file</li>
            <li>Answer guided questions (and optionally upload your ID for W-7)</li>
            <li>Review your answers, then download the pre-filled official IRS PDF</li>
          </ol>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-500 text-xs leading-relaxed">
            <strong className="text-gray-600">Disclaimer:</strong> This tool helps organize your
            information for IRS tax forms. It is not legal or tax advice. Always review the
            completed form with a qualified tax professional before filing.
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
