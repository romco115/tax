export type FilerType = "Individual" | "Estate" | "Trust";
export type YesNo = "yes" | "no";
export type PropertyType = "Cash" | "Securities" | "Real Property" | "Other";
export type QuestionType =
  | "text"
  | "number"
  | "date"
  | "select"
  | "yesno"
  | "currency"
  | "repeating";
export type FormPart = "identification" | "routing" | "I" | "II" | "III" | "IV";

export interface RepeatingFieldDef {
  id: string;
  label: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export interface QuestionDefinition {
  id: string;
  part: FormPart;
  label: string;
  help_text?: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  validation?: Record<string, unknown>;
  triggers_part?: "I" | "II" | "III" | "IV";
  fields?: RepeatingFieldDef[];
}

export interface FilerIdentification {
  taxpayer_name: string;
  taxpayer_tin: string;
  taxpayer_address: string;
  taxpayer_city_state_zip: string;
  tax_year: number;
  filer_type: FilerType;
  is_amended: YesNo;
}

export interface PartITransfer {
  p1_trust_name: string;
  p1_trust_country: string;
  p1_transfer_date: string;
  p1_trust_ein?: string;
  p1_property_type: PropertyType;
  p1_fmv: number;
  p1_is_grantor: YesNo;
  p1_received_fmv: YesNo;
  p1_3520a_filed: YesNo;
}

export interface PartIIOwnership {
  p2_trust_name: string;
  p2_trust_country: string;
  p2_creation_date: string;
  p2_trust_ein: string;
  p2_asset_value: number;
  p2_ownership_pct: number;
  p2_trustee_name: string;
  p2_trustee_address: string;
  p2_trustee_is_us: YesNo;
  p2_3520a_filed: YesNo;
}

export interface PartIIIDistribution {
  p3_trust_name: string;
  p3_trust_country: string;
  p3_dist_date: string;
  p3_dist_amount: number;
  p3_is_grantor_trust: YesNo;
  p3_is_accumulation: YesNo;
  p3_loans: YesNo;
}

export interface PartIVGift {
  date_received: string;
  description: string;
  fmv: number;
  donor_name: string;
  donor_address: string;
}

export interface PartIVGifts {
  p4_from_individual: YesNo;
  p4_individual_total?: number;
  p4_from_corp: YesNo;
  p4_corp_total?: number;
  p4_gifts: PartIVGift[];
}

export interface PartsApplicable {
  part_i: boolean;
  part_ii: boolean;
  part_iii: boolean;
  part_iv: boolean;
}

export interface FormAnswers {
  identification: FilerIdentification;
  parts_applicable: PartsApplicable;
  part_i_transfers: PartITransfer[];
  part_ii_ownerships: PartIIOwnership[];
  part_iii_distributions: PartIIIDistribution[];
  part_iv_gifts: PartIVGifts | null;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ApiError {
  message: string;
  detail?: string;
}
