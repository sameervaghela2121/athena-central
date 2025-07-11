// Intent types
export type IntentType =
  | "booking"
  | "update"
  | "general"
  | "conversation"
  | "testsAndResults"
  | "prescription"
  | "referral"
  | "concern"
  | "provider";

export interface Option {
  label: string;
  value: string | number;
  name?: string | number;
}
