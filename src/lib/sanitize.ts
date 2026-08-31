/**
 * Security utilities — sanitize and validate all user-supplied strings
 * before storing or rendering them. React escapes JSX text by default, but
 * these helpers guard stored data, query params, and shared URLs.
 */

/** Strip every HTML/script tag from a string to prevent stored XSS. */
export function sanitizeText(value: string, maxLen = 4000): string {
  return value
    .replace(/<[^>]*>/g, "")        // strip HTML tags
    .replace(/javascript:/gi, "")  // strip JS pseudo-protocol
    .replace(/on\w+\s*=/gi, "")    // strip inline event handlers
    .slice(0, maxLen)
    .trim()
}

/** Limit a number to a safe range to prevent overflow / injection via numeric fields. */
export function sanitizeNumber(value: unknown, min: number, max: number): number {
  const n = Number(value)
  if (isNaN(n)) return min
  if (n === Infinity) return max
  if (n === -Infinity) return min
  return Math.min(max, Math.max(min, n))
}

/** Validate an email address format. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Validate an Israeli phone number (052xxxxxxx / +97252xxxxxxx). */
export function isValidIsraeliPhone(phone: string): boolean {
  return /^(\+972|0)(5[0-9])\d{7}$/.test(phone.replace(/[\s\-]/g, ""))
}

/** Ensure a URL is http/https only — prevents javascript: URLs in links. */
export function sanitizeUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.protocol !== "http:" && u.protocol !== "https:") return "#"
    return url
  } catch {
    return "#"
  }
}

/** Build safe URLSearchParams, sanitizing all values. */
export function buildSafeParams(obj: Record<string, string | number>): URLSearchParams {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) {
    p.set(sanitizeText(k, 50), sanitizeText(String(v), 500))
  }
  return p
}
