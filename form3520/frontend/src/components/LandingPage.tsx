import { useNavigate } from "react-router-dom";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">IRS</span>
            </div>
            <span className="font-semibold text-gray-900">Form 3520 Interview</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-16">
        <div className="bg-white rounded-2xl shadow-md p-10 mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-3">
            U.S. Tax Compliance Tool
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
            IRS Form 3520
            <br />
            <span className="text-blue-600">Step-by-Step Interview</span>
          </h1>
          <p className="text-gray-600 leading-relaxed mb-6">
            Form 3520 is required if you transferred money to a foreign trust, owned a foreign
            trust, received distributions from a foreign trust, or received large gifts from
            foreign persons during the tax year.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            This tool guides you through a plain-English interview, then fills and downloads the
            official IRS PDF with your information — in minutes.
          </p>
          <button
            onClick={() => navigate("/interview")}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg transition-colors text-base"
          >
            Start Interview →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              icon: "📋",
              title: "4 Parts Covered",
              desc: "Transfers, ownership, distributions, and foreign gifts — all in one session.",
            },
            {
              icon: "⚡",
              title: "Smart Branching",
              desc: "Only see questions relevant to your situation. Skip parts that don't apply.",
            },
            {
              icon: "⚠️",
              title: "IRS Warnings Built In",
              desc: "Real-time alerts for key compliance rules, thresholds, and penalty triggers.",
            },
            {
              icon: "📄",
              title: "Official PDF Output",
              desc: "Downloads the actual IRS Form 3520 with your data filled in.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6">
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
