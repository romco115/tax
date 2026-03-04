import type { FormAnswers, PartITransfer, PartIIOwnership, PartIIIDistribution } from "../types/form3520";

interface ReviewSummaryProps {
  answers: FormAnswers;
  warnings: string[];
  onEdit: (partId: string) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

function fmt(v: unknown): string {
  if (v === undefined || v === null || v === "") return "—";
  if (typeof v === "number") return v.toLocaleString();
  return String(v);
}

function fmtCurrency(v: unknown): string {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  if (isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

interface SectionProps {
  title: string;
  partId: string;
  onEdit: (id: string) => void;
  rows: [string, string][];
}

function Section({ title, partId, onEdit, rows }: SectionProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
        <button
          onClick={() => onEdit(partId)}
          className="text-blue-600 hover:underline text-xs font-medium"
        >
          Edit
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {rows.map(([label, value], i) => (
          <div key={i} className="flex px-5 py-2.5">
            <span className="w-1/2 text-xs text-gray-500">{label}</span>
            <span className="w-1/2 text-sm text-gray-900 font-medium">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ReviewSummary: React.FC<ReviewSummaryProps> = ({
  answers,
  warnings,
  onEdit,
  onGenerate,
  isGenerating,
}) => {
  const { identification, parts_applicable, part_i_transfers, part_ii_ownerships, part_iii_distributions, part_iv_gifts } = answers;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-md p-8 mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-1">Review Your Answers</h2>
        <p className="text-gray-600 text-sm">
          Check everything below before generating your Form 3520.
        </p>
      </div>

      {warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6">
          <p className="font-semibold text-yellow-800 text-sm mb-2">IRS Notices &amp; Warnings</p>
          <ul className="space-y-1">
            {warnings.map((w, i) => (
              <li key={i} className="text-yellow-700 text-sm">
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section
        title="Filer Identification"
        partId="identification"
        onEdit={onEdit}
        rows={[
          ["Name", fmt(identification.taxpayer_name)],
          ["TIN", fmt(identification.taxpayer_tin)],
          ["Address", fmt(identification.taxpayer_address)],
          ["City / State / ZIP", fmt(identification.taxpayer_city_state_zip)],
          ["Tax Year", fmt(identification.tax_year)],
          ["Filing As", fmt(identification.filer_type)],
          ["Amended Return", identification.is_amended === "yes" ? "Yes" : "No"],
        ]}
      />

      {parts_applicable.part_i && part_i_transfers.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Part I — Transfers to Foreign Trusts
          </p>
          {part_i_transfers.map((t: PartITransfer, i: number) => (
            <Section
              key={i}
              title={`Transfer ${i + 1}: ${t.p1_trust_name || "Unnamed Trust"}`}
              partId="I"
              onEdit={onEdit}
              rows={[
                ["Trust Country", fmt(t.p1_trust_country)],
                ["Transfer Date", fmt(t.p1_transfer_date)],
                ["Property Type", fmt(t.p1_property_type)],
                ["Fair Market Value", fmtCurrency(t.p1_fmv)],
                ["Grantor?", t.p1_is_grantor === "yes" ? "Yes" : "No"],
                ["Received FMV?", t.p1_received_fmv === "yes" ? "Yes" : "No"],
                ["Form 3520-A Filed?", t.p1_3520a_filed === "yes" ? "Yes" : "No"],
              ]}
            />
          ))}
        </div>
      )}

      {parts_applicable.part_ii && part_ii_ownerships.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Part II — Foreign Trust Ownership
          </p>
          {part_ii_ownerships.map((o: PartIIOwnership, i: number) => (
            <Section
              key={i}
              title={`Trust ${i + 1}: ${o.p2_trust_name || "Unnamed Trust"}`}
              partId="II"
              onEdit={onEdit}
              rows={[
                ["Country", fmt(o.p2_trust_country)],
                ["Created", fmt(o.p2_creation_date)],
                ["Asset Value", fmtCurrency(o.p2_asset_value)],
                ["Ownership %", `${fmt(o.p2_ownership_pct)}%`],
                ["Trustee", fmt(o.p2_trustee_name)],
                ["Form 3520-A Filed?", o.p2_3520a_filed === "yes" ? "Yes" : "No"],
              ]}
            />
          ))}
        </div>
      )}

      {parts_applicable.part_iii && part_iii_distributions.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Part III — Distributions from Foreign Trusts
          </p>
          {part_iii_distributions.map((d: PartIIIDistribution, i: number) => (
            <Section
              key={i}
              title={`Distribution ${i + 1}: ${d.p3_trust_name || "Unnamed Trust"}`}
              partId="III"
              onEdit={onEdit}
              rows={[
                ["Date", fmt(d.p3_dist_date)],
                ["Amount", fmtCurrency(d.p3_dist_amount)],
                ["Grantor Trust?", d.p3_is_grantor_trust === "yes" ? "Yes" : "No"],
                ["Accumulation Dist.?", d.p3_is_accumulation === "yes" ? "Yes" : "No"],
              ]}
            />
          ))}
        </div>
      )}

      {parts_applicable.part_iv && part_iv_gifts && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
            Part IV — Foreign Gifts & Bequests
          </p>
          <Section
            title="Gift Summary"
            partId="IV"
            onEdit={onEdit}
            rows={[
              ["From Individual/Estate?", part_iv_gifts.p4_from_individual === "yes" ? "Yes" : "No"],
              ...(part_iv_gifts.p4_from_individual === "yes"
                ? [["Total (Individual)", fmtCurrency(part_iv_gifts.p4_individual_total)] as [string, string]]
                : []),
              ["From Corp/Partnership?", part_iv_gifts.p4_from_corp === "yes" ? "Yes" : "No"],
              ...(part_iv_gifts.p4_from_corp === "yes"
                ? [["Total (Corp/Partnership)", fmtCurrency(part_iv_gifts.p4_corp_total)] as [string, string]]
                : []),
              ["Number of Gifts Listed", String(part_iv_gifts.p4_gifts.length)],
            ]}
          />
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-md p-8 mt-6 text-center">
        <p className="text-gray-600 text-sm mb-5">
          Everything look right? Generate your completed Form 3520 PDF.
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-8 py-3 rounded-lg transition-colors text-base"
        >
          {isGenerating ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating PDF…
            </span>
          ) : (
            "Generate My Form 3520 →"
          )}
        </button>
      </div>
    </div>
  );
};

export default ReviewSummary;
