/**
 * Chat types mirroring backend chat DTOs and frontend state.
 */

export interface ChatMessage {
  id: string
  user_query: string
  llm_response: string
  created_at: string
}

export interface ChatResponse {
  conversation_id: string
  title: string
  user_query: string
  llm_response: string
}

export interface ConversationSummary {
  id: string
  title: string
  page_id: string
  created_at: string
}

export interface GeminiModelOption {
  key: string
  name: string
  badge: string
  description: string
}

export const GEMINI_MODELS: GeminiModelOption[] = [
  {
    key: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    badge: "Fastest",
    description: "High speed, balanced intelligence for instant insights",
  },
  {
    key: "gemini-3.8-flash",
    name: "Gemini 3.8 Flash",
    badge: "Deep Reasoning",
    description: "Complex strategic reasoning and multi-metric analysis",
  },
  {
    key: "gemini-3-flash-preview",
    name: "Gemini 3 Flash Preview",
    badge: "Newest",
    description: "Reliable and lightweight generation for straightforward queries",
  },
]

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS[0].key
