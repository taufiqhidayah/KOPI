import type { AspirationCategory } from "@/lib/mock-data";

export type ChatConversationStatus = "collecting" | "complete";

export interface ChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface AspirationDetail {
  label: string;
  value: string;
}

export interface MemberChatRequest {
  message: string;
  history: ChatHistoryItem[];
  memberName: string;
  memberId: string;
  cooperativeName: string;
  cooperativeCode: string;
  village: string;
  /** Draft aspirasi saat anggota merevisi sebelum konfirmasi final */
  pendingDraft?: {
    title?: string;
    summary?: string;
    details: AspirationDetail[];
    category: AspirationCategory;
  };
}

export interface MemberChatResponse {
  status: ChatConversationStatus;
  category: AspirationCategory | "belum_jelas";
  reply: string;
  title?: string;
  summary?: string;
  details: AspirationDetail[];
  followUps: string[];
  demo?: boolean;
}

export type ChatApiErrorCode =
  | "quota_exceeded"
  | "rate_limited"
  | "config_error"
  | "unknown";

export interface ChatApiErrorBody {
  error: string;
  code?: ChatApiErrorCode;
  retryAfterSeconds?: number;
}

export interface DecisionAnalysisRequest {
  aspirationTitle: string;
  aspirationDescription: string;
  category: AspirationCategory;
  memberName: string;
  omzet: number;
  shu: number;
  kas: number;
}

export interface DecisionAnalysisResponse {
  score: number;
  roi: string;
  rationale: string;
  decision: string;
}
