import { useState, useRef, useCallback } from "react"

interface UseVoiceInputOptions {
  onResult: (text: string) => void
  lang?: string
}

export function useVoiceInput({ onResult, lang = "he-IL" }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false)
  const [supported] = useState(() =>
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  )
  const recRef = useRef<InstanceType<typeof window.SpeechRecognition> | null>(null)

  const start = useCallback(() => {
    if (!supported) return
    const SR = window.SpeechRecognition ?? (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition
    const rec = new SR()
    rec.lang = lang
    rec.continuous = false
    rec.interimResults = false

    rec.onstart = () => setListening(true)
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0][0].transcript
      onResult(transcript)
    }

    recRef.current = rec
    rec.start()
  }, [supported, lang, onResult])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setListening(false)
  }, [])

  const toggle = useCallback(() => {
    if (listening) stop()
    else start()
  }, [listening, start, stop])

  return { listening, supported, toggle }
}
