import axios from "axios";
import type { QuestionDefinition, FormAnswers, ValidationResult } from "../types/form3520";
import type { ExtractedIdData } from "../types/w7";

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8001";

const http = axios.create({ baseURL: BASE_URL });

export const api = {
  // ── Form 3520 ──────────────────────────────────────────────────────────────
  getQuestions: (): Promise<QuestionDefinition[]> =>
    http.get<QuestionDefinition[]>("/api/questions").then((r) => r.data),

  validate: (field: string, value: unknown): Promise<ValidationResult> =>
    http.post<ValidationResult>("/api/validate", { field, value }).then((r) => r.data),

  generatePdf: async (answers: FormAnswers): Promise<Blob> => {
    const response = await http.post<Blob>("/api/generate-pdf", answers, {
      responseType: "blob",
    });
    return response.data;
  },

  // ── Form W-7 ───────────────────────────────────────────────────────────────
  getW7Questions: (): Promise<QuestionDefinition[]> =>
    http.get<QuestionDefinition[]>("/api/w7/questions").then((r) => r.data),

  validateW7: (field: string, value: unknown): Promise<ValidationResult> =>
    http.post<ValidationResult>("/api/w7/validate", { field, value }).then((r) => r.data),

  generateW7Pdf: async (answers: Record<string, unknown>): Promise<Blob> => {
    const response = await http.post<Blob>("/api/w7/generate-pdf", answers, {
      responseType: "blob",
    });
    return response.data;
  },

  extractId: async (files: File[]): Promise<ExtractedIdData> => {
    const form = new FormData();
    for (const f of files) form.append("files", f);
    const response = await http.post<ExtractedIdData>("/api/w7/extract-id", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },
};
