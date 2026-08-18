import { supabase } from "@/lib/supabase"

interface NotifyOptions {
  event: string
  title?: string
  details?: Record<string, unknown>
}

let queue: NotifyOptions[] = []
let flushTimer: ReturnType<typeof setTimeout> | null = null

async function flush(): Promise<void> {
  if (queue.length === 0) return
  const batch = queue.splice(0, queue.length)
  for (const item of batch) {
    try {
      await supabase.functions.invoke("telegram-notify", {
        body: {
          ...item,
          url: typeof window !== "undefined" ? window.location.href : undefined,
        },
      })
    } catch {
      // fire-and-forget: never block UX on notifications
    }
  }
}

function scheduleFlush(): void {
  if (flushTimer) return
  flushTimer = setTimeout(() => {
    flushTimer = null
    void flush()
  }, 2000)
}

export function notifyTelegram(options: NotifyOptions): void {
  // Avoid spamming Telegram for every page view once a session is established.
  // We still send the first view per session, and all other meaningful events.
  if (options.event === "page_view") {
    const key = "tg_first_view_sent"
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, "1")
  }
  queue.push(options)
  scheduleFlush()
}
