import { useState, useRef, useCallback } from "react";
import { api } from "../api/client";
import type { ExtractedIdData } from "../types/w7";

interface IdUploadCardProps {
  onConfirm: (extracted: ExtractedIdData) => void;
  onSkip: () => void;
  onQuickGenerate: (extracted: ExtractedIdData) => Promise<void>;
}

type UploadPhase = "idle" | "selected" | "extracting" | "done" | "error";

const ACCEPT_ATTR = "image/*,application/pdf";

const FIELD_LABELS: Array<{ key: keyof ExtractedIdData; label: string }> = [
  { key: "first_name",  label: "First name" },
  { key: "last_name",   label: "Last name" },
  { key: "dob",         label: "Date of birth" },
  { key: "doc_type",    label: "Document type" },
  { key: "doc_number",  label: "Document number" },
  { key: "doc_expiry",  label: "Expiration date" },
  { key: "issued_by",   label: "Issued by" },
  { key: "country",     label: "Country" },
  { key: "address",     label: "Address" },
  { key: "sex",         label: "Sex" },
  { key: "foreign_tin", label: "Foreign tax ID" },
  { key: "visa_info",   label: "U.S. visa" },
];

interface FileEntry {
  file: File;
  previewUrl: string | null; // null for PDFs
  isPdf: boolean;
}

function buildEntries(files: File[]): FileEntry[] {
  return files.map((f) => {
    const isPdf = f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf");
    return {
      file: f,
      previewUrl: isPdf ? null : URL.createObjectURL(f),
      isPdf,
    };
  });
}

function revokeEntries(entries: FileEntry[]) {
  for (const e of entries) {
    if (e.previewUrl) URL.revokeObjectURL(e.previewUrl);
  }
}

const IdUploadCard: React.FC<IdUploadCardProps> = ({ onConfirm, onSkip, onQuickGenerate }) => {
  const [phase, setPhase]         = useState<UploadPhase>("idle");
  const [entries, setEntries]     = useState<FileEntry[]>([]);
  const [extracted, setExtracted] = useState<ExtractedIdData | null>(null);
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickGenerating, setQuickGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(
      (f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
    );
    if (valid.length === 0) {
      setErrorMsg("Please upload image files (JPEG, PNG, etc.) or PDF documents.");
      return;
    }
    const rejected = incoming.length - valid.length;
    if (rejected > 0) {
      setErrorMsg(`${rejected} unsupported file${rejected > 1 ? "s were" : " was"} skipped.`);
    } else {
      setErrorMsg(null);
    }
    setEntries((prev) => {
      revokeEntries(prev);
      return buildEntries(valid);
    });
    setPhase("selected");
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFiles(Array.from(e.dataTransfer.files));
    },
    [handleFiles],
  );

  const handleAddMore = useCallback(
    (incoming: File[]) => {
      const valid = incoming.filter(
        (f) => f.type.startsWith("image/") || f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );
      if (valid.length === 0) return;
      setEntries((prev) => [...prev, ...buildEntries(valid)]);
    },
    [],
  );

  const handleRemove = useCallback((idx: number) => {
    setEntries((prev) => {
      const next = [...prev];
      if (next[idx].previewUrl) URL.revokeObjectURL(next[idx].previewUrl!);
      next.splice(idx, 1);
      if (next.length === 0) setPhase("idle");
      return next;
    });
  }, []);

  const handleExtract = async () => {
    if (entries.length === 0) return;
    setPhase("extracting");
    try {
      const result = await api.extractId(entries.map((e) => e.file));
      setExtracted(result);
      setPhase("done");
    } catch {
      setErrorMsg("Could not extract data from the uploaded files. You can re-upload or skip this step.");
      setPhase("error");
    }
  };

  const handleReset = () => {
    revokeEntries(entries);
    setEntries([]);
    setExtracted(null);
    setErrorMsg(null);
    setPhase("idle");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const extractedCount = extracted
    ? Object.values(extracted).filter((v) => v !== null && v !== "").length
    : 0;

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-100 overflow-hidden animate-fade-up">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />

        <div className="p-8 sm:p-10">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Scan your ID</h2>
              <p className="text-sm text-gray-500">Images or PDFs · multiple files supported</p>
            </div>
          </div>

          {/* ── IDLE / ERROR — drop zone ── */}
          {(phase === "idle" || phase === "error") && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors duration-200 ${
                  isDragOver
                    ? "border-violet-400 bg-violet-50"
                    : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
                }`}
              >
                <svg className="w-10 h-10 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm font-medium text-gray-600 mb-1">Drop your files here</p>
                <p className="text-xs text-gray-400">or click to browse · JPEG, PNG, PDF · multiple files OK</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0)
                    handleFiles(Array.from(e.target.files));
                }}
              />
              {errorMsg && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  {errorMsg}
                </div>
              )}
            </>
          )}

          {/* ── SELECTED — file list + extract ── */}
          {phase === "selected" && (
            <>
              {/* File thumbnails */}
              <div className="space-y-2 mb-4">
                {entries.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {entry.isPdf ? (
                      <div className="w-10 h-12 bg-red-50 border border-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    ) : (
                      <img
                        src={entry.previewUrl!}
                        alt="preview"
                        className="w-10 h-12 object-cover rounded-lg flex-shrink-0 border border-gray-100"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{entry.file.name}</p>
                      <p className="text-xs text-gray-400">
                        {entry.isPdf ? "PDF document" : "Image"} · {(entry.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(idx)}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Remove"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add more */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-gray-200 hover:border-violet-300 rounded-xl py-2.5 text-xs text-gray-400 hover:text-violet-600 transition-colors mb-4"
              >
                + Add more files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTR}
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleAddMore(Array.from(e.target.files));
                    e.target.value = "";
                  }
                }}
              />

              {errorMsg && (
                <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleExtract}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-violet-200/60"
                >
                  Extract data →
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </>
          )}

          {/* ── EXTRACTING — spinner ── */}
          {phase === "extracting" && (
            <div className="text-center py-8">
              <div className="relative w-12 h-12 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-violet-100" />
                <div className="absolute inset-0 rounded-full border-4 border-violet-600 border-t-transparent animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-600">
                Reading {entries.length} file{entries.length !== 1 ? "s" : ""}…
              </p>
              <p className="text-xs text-gray-400 mt-1">This takes a few seconds</p>
            </div>
          )}

          {/* ── DONE — results ── */}
          {phase === "done" && extracted && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-700">
                  {extractedCount} field{extractedCount !== 1 ? "s" : ""} detected across {entries.length} file{entries.length !== 1 ? "s" : ""}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-5 space-y-2">
                {FIELD_LABELS.map(({ key, label }) => {
                  const val = extracted[key];
                  if (!val) return null;
                  return (
                    <div key={key} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-500 flex-shrink-0">{label}</span>
                      <span className="text-gray-900 font-medium text-right truncate">{val}</span>
                    </div>
                  );
                })}
                {extractedCount === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">
                    No fields could be extracted from these files.
                  </p>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-5">
                <p className="text-xs text-amber-700 leading-relaxed">
                  <span className="font-semibold">Note:</span> Some fields (application type, reason for applying, mailing address, etc.) cannot be extracted from your documents and will appear as &quot;N/A&quot; on the PDF. Use &quot;Continue to form&quot; to fill them in manually.
                </p>
              </div>

              <div className="flex gap-3 mb-3">
                <button
                  onClick={() => onConfirm(extracted)}
                  className="flex-1 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm shadow-lg shadow-violet-200/60"
                >
                  Continue to form →
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Re-upload
                </button>
              </div>

              <button
                onClick={async () => {
                  setQuickGenerating(true);
                  try { await onQuickGenerate(extracted); } finally { setQuickGenerating(false); }
                }}
                disabled={quickGenerating}
                className="w-full border border-violet-200 bg-violet-50 hover:bg-violet-100 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] text-violet-700 font-semibold py-2.5 rounded-xl transition-all duration-150 text-sm flex items-center justify-center gap-2"
              >
                {quickGenerating ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate PDF now (missing fields will be N/A)
                  </>
                )}
              </button>
            </div>
          )}

          {/* Skip */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-center">
            <button
              onClick={onSkip}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Skip this step — I'll enter my information manually
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IdUploadCard;
