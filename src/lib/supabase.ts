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

export type SavedKind = "result"

export interface SavedItem {
  id: string
  user_id: string
  calculator_slug: string
  calculator_title: string
  kind: SavedKind
  inputs: Record<string, string | number> | null
  summary: string | null
  created_at: string
}

export type ContactStatus = "new" | "read" | "replied" | "archived"

export interface ContactSubmission {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  user_id: string | null
  created_at: string
  updated_at: string
}

export interface CustomCalculator {
  id: string
  slug: string
  title: string
  short_title: string
  category_slug: string
  description: string
  seo_title: string | null
  seo_description: string | null
  keywords: string[]
  inputs: Array<{
    id: string
    label: string
    type: "number" | "select" | "date"
    min?: number
    max?: number
    step?: number
    unit?: string
    options?: Array<{ value: string; label: string }>
    defaultValue?: string | number
  }>
  formula_code: string
  result_labels: Record<string, string>
  quick_answer: { question: string; answer: string } | null
  formula_explanation: string | null
  example_text: string | null
  faqs: Array<{ question: string; answer: string }>
  related_slugs: string[]
  disclaimer: string | null
  source_note: string | null
  seo_content: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}
