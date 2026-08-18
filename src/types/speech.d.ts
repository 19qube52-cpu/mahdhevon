export {}

interface SpeechRecognitionEventResultAlt {
  readonly transcript: string
}

declare global {
  interface SpeechRecognitionEvent extends Event {
    readonly results: {
      readonly length: number
      [index: number]: { [index: number]: SpeechRecognitionEventResultAlt }
    }
  }
  interface SpeechRecognitionInstance {
    lang: string
    continuous: boolean
    interimResults: boolean
    onstart: (() => void) | null
    onend: (() => void) | null
    onerror: (() => void) | null
    onresult: ((e: SpeechRecognitionEvent) => void) | null
    start: () => void
    stop: () => void
  }
  interface SpeechRecognitionCtor {
    new (): SpeechRecognitionInstance
  }

  var SpeechRecognition: SpeechRecognitionCtor

  interface Window {
    SpeechRecognition: SpeechRecognitionCtor
    webkitSpeechRecognition: SpeechRecognitionCtor
  }
}
