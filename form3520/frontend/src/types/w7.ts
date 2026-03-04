export type W7ReasonCode =
  | "a — Nonresident alien: tax treaty benefit"
  | "b — Nonresident alien: filing U.S. federal return"
  | "c — U.S. resident alien: filing U.S. federal return"
  | "d — Dependent of U.S. citizen/resident alien"
  | "e — Spouse of U.S. citizen/resident alien"
  | "f — Nonresident alien student/professor/researcher"
  | "g — Dependent/spouse of nonresident alien (U.S. visa)"
  | "h — Other";

export interface W7Answers {
  application_type?: string;
  reason?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  name_different_at_birth?: "yes" | "no";
  birth_first_name?: string;
  birth_middle_name?: string;
  birth_last_name?: string;
  mailing_street?: string;
  mailing_city_country?: string;
  has_foreign_address?: "yes" | "no";
  foreign_street?: string;
  foreign_city_country?: string;
  dob?: string;
  country_of_birth?: string;
  city_of_birth?: string;
  sex?: "Male" | "Female";
  country_citizenship?: string;
  has_foreign_tin?: "yes" | "no";
  foreign_tin?: string;
  has_us_visa?: "yes" | "no";
  visa_type?: string;
  doc_type?: string;
  doc_issued_by?: string;
  doc_number?: string;
  doc_expiry?: string;
  prev_tin?: string;
  prev_itin?: string;
  applicant_phone?: string;
}

export interface ExtractedIdData {
  first_name: string | null;
  last_name: string | null;
  dob: string | null;
  doc_number: string | null;
  doc_expiry: string | null;
  doc_type: string | null;
  issued_by: string | null;
  country: string | null;
  address: string | null;
  sex: string | null;
}
