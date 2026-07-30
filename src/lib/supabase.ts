import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type QueueStatus = "pending" | "published" | "skipped"

export interface QueueItem {
  id: string
  calculator_id: string
  calculator_slug: string
  calculator_title: string
  calculator_category: string | null
  position: number
  status: QueueStatus
  scheduled_date: string | null
  published_at: string | null
  notes: string | null
  added_at: string
}

export interface DailyFeatured {
  id: string
  date: string
  calculator_slug: string
  calculator_id: string
  calculator_title: string
  published_at: string
}

export interface Favorite {
  id: string
  user_id: string
  calculator_slug: string
  calculator_title: string
  category_slug: string | null
  created_at: string
}

export interface RightItem {
  title: string
  authority: string
  description: string
  howToClaim: string
}

export interface LetterItem {
  to: string
  subject: string
  body: string
}

export interface RightsResult {
  caseTitle: string
  summary: string
  strategy: string
  urgency: "low" | "medium" | "high"
  rights: RightItem[]
  letters: LetterItem[]
}

export interface RightsCase {
  id: string
  user_id: string
  title: string
  case_type: string
  description: string
  accusation: string
  ai_analysis: string
  rights_found: RightItem[]
  generated_letters: LetterItem[]
  status: string
  created_at: string
}

export type SavedKind = "result" | "ai"

export interface SavedItem {
  id: string
  user_id: string
  calculator_slug: string
  calculator_title: string
  kind: SavedKind
  inputs: Record<string, string | number> | null
  summary: string | null
  ai_text: string | null
  provider: string | null
  created_at: string
}
