import { useState } from "react"
import { Sparkles, Loader2, X, Wand2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { CustomCalculator } from "@/lib/supabase"

interface AiGenerateProps {
  onGenerated: (calc: Partial<CustomCalculator> & { slug: string; title: string }) => void
  onClose: () => void
}

export function AiGenerateDialog({ onGenerated, onClose }: AiGenerateProps) {
  const [prompt, setPrompt] = useState("")
  const [provider, setProvider] = useState<"auto" | "grok" | "ollama">("auto")
  const [loading, setLoading] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const examples = [
    "מחשבון המרה מקילומטר למייל",
    "מחשבון עלות חשמל חודשית לפי צריכה ב-kWh ומחיר לקוט",
    "מחשבון BMI לילדים עם טווחי גיל",
    'מחשבון החזר הוצאות רכב לעצמאי לפי ק"מ ותעריף',
  ]

  const generateImage = async (calcTitle: string, calcDescription: string): Promise<string | null> => {
    setGeneratingImage(true)
    try {
      const imagePrompt = `A modern, clean illustration for a financial calculator app. Subject: "${calcTitle}". Description: "${calcDescription}". Style: flat design, minimal, professional, blue and green color palette, no text, no words, no letters. Square composition.`
      const { data, error: fnError } = await supabase.functions.invoke("ai-generate-image", {
        body: { prompt: imagePrompt },
      })
      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      if (data?.url) {
        setImageUrl(data.url)
        return data.url
      }
      return null
    } catch {
      return null
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError("נא לתאר את המחשבון"); return }
    setError(null)
    setLoading(true)
    setImageUrl(null)

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-generate-calculator", {
        body: { prompt: prompt.trim(), provider },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      if (!data?.calculator) throw new Error("ה-AI לא החזיר תוצאה")

      const calc = data.calculator as Record<string, unknown>
      const title = String(calc.title ?? "")
      const description = String(calc.description ?? "")

      const generatedImageUrl = await generateImage(title, description)

      onGenerated({
        slug: String(calc.slug ?? ""),
        title,
        short_title: String(calc.short_title ?? title),
        category_slug: String(calc.category_slug ?? "general-tools"),
        description,
        inputs: Array.isArray(calc.inputs) ? calc.inputs : [],
        formula_code: String(calc.formula_code ?? "return {}"),
        result_labels: (calc.result_labels ?? {}) as Record<string, string>,
        quick_answer: (calc.quick_answer ?? null) as { question: string; answer: string } | null,
        formula_explanation: String(calc.formula_explanation ?? ""),
        example_text: String(calc.example_text ?? ""),
        faqs: Array.isArray(calc.faqs) ? calc.faqs : [],
        disclaimer: String(calc.disclaimer ?? ""),
        image_url: generatedImageUrl ?? undefined,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה לא צפויה")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            יצירת מחשבון ב-AI
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-2">
          <Label>תאר את המחשבון בשפה חופשית</Label>
          <Textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={4}
            placeholder="לדוגמה: מחשבון שמחשב כמה מס קנייה צריך לשלם על מוצר בהתאם למחיר ולאחוז המס"
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <Label>ספק AI</Label>
          <Select value={provider} onValueChange={(v) => setProvider(v as "auto" | "grok" | "ollama")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">אוטומטי (לפי זמינות)</SelectItem>
              <SelectItem value="grok">xAI Grok</SelectItem>
              <SelectItem value="ollama">Ollama</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap gap-2">
          {examples.map((ex) => (
            <button
              key={ex}
              onClick={() => setPrompt(ex)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/70 text-muted-foreground transition-colors"
            >
              {ex}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {generatingImage && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            מייצר תמונה למחשבון...
          </div>
        )}

        {imageUrl && !loading && (
          <div className="rounded-xl overflow-hidden border border-border">
            <img src={imageUrl} alt="תמונת המחשבון" className="w-full h-48 object-cover" />
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button onClick={handleGenerate} disabled={loading || generatingImage}>
            {loading || generatingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? "מייצר..." : generatingImage ? "מייצר תמונה..." : "צור מחשבון"}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function AiGenerateButton({ onGenerated }: { onGenerated: (calc: Partial<CustomCalculator> & { slug: string; title: string }) => void }) {
  const [show, setShow] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setShow(true)}>
        <Sparkles className="w-4 h-4" />
        צור ב-AI
      </Button>
      {show && (
        <AiGenerateDialog
          onGenerated={(calc) => { setShow(false); onGenerated(calc) }}
          onClose={() => setShow(false)}
        />
      )}
    </>
  )
}
