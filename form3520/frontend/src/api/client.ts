import axios from "axios";
import type { QuestionDefinition, FormAnswers, ValidationResult } from "../types/form3520";

const BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8001";

const http = axios.create({ baseURL: BASE_URL });

export const api = {
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
};
