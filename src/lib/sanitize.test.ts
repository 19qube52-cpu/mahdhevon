import { describe, it, expect } from "vitest"
import {
  sanitizeText,
  sanitizeNumber,
  isValidEmail,
  isValidIsraeliPhone,
  sanitizeUrl,
  buildSafeParams,
} from "./sanitize"

describe("sanitizeText", () => {
  it("strips HTML tags, keeping inner text", () => {
    // Tags are removed; their text content remains (React escapes it on render, so it is safe)
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("alert('xss')")
    expect(sanitizeText("<b>שלום</b>")).toBe("שלום")
    expect(sanitizeText("<img src=x onerror=alert(1)>")).toBe("")
  })

  it("removes javascript: pseudo-protocol", () => {
    expect(sanitizeText("javascript:alert(1)")).not.toContain("javascript:")
  })

  it("removes inline event handlers", () => {
    expect(sanitizeText('onclick=alert(1)')).not.toContain("onclick=")
  })

  it("respects maxLen", () => {
    expect(sanitizeText("א".repeat(100), 10)).toHaveLength(10)
  })

  it("trims whitespace", () => {
    expect(sanitizeText("  שלום  ")).toBe("שלום")
  })

  it("passes safe text through unchanged", () => {
    const safe = "בדיקה: 1,234.56 ₪ — כן/לא"
    expect(sanitizeText(safe)).toBe(safe)
  })
})

describe("sanitizeNumber", () => {
  it("clamps values to [min, max]", () => {
    expect(sanitizeNumber(200, 0, 100)).toBe(100)
    expect(sanitizeNumber(-5, 0, 100)).toBe(0)
    expect(sanitizeNumber(50, 0, 100)).toBe(50)
  })

  it("falls back to min for NaN / non-numbers", () => {
    expect(sanitizeNumber("abc", 0, 100)).toBe(0)
    expect(sanitizeNumber(NaN, 0, 100)).toBe(0)
    expect(sanitizeNumber(undefined, 5, 50)).toBe(5)
  })

  it("handles Infinity", () => {
    expect(sanitizeNumber(Infinity, 0, 100)).toBe(100)
  })
})

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true)
    expect(isValidEmail("test+label@sub.domain.co.il")).toBe(true)
  })

  it("rejects invalid emails", () => {
    expect(isValidEmail("not-an-email")).toBe(false)
    expect(isValidEmail("missing@")).toBe(false)
    expect(isValidEmail("@nodomain.com")).toBe(false)
  })
})

describe("isValidIsraeliPhone", () => {
  it("accepts valid Israeli mobiles", () => {
    expect(isValidIsraeliPhone("0521234567")).toBe(true)
    expect(isValidIsraeliPhone("+972521234567")).toBe(true)
  })

  it("rejects invalid phones", () => {
    expect(isValidIsraeliPhone("123")).toBe(false)
    expect(isValidIsraeliPhone("021234567")).toBe(false)
  })
})

describe("sanitizeUrl", () => {
  it("allows http/https URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com")
    expect(sanitizeUrl("http://example.com/path?q=1")).toBe("http://example.com/path?q=1")
  })

  it("blocks javascript: URLs", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#")
  })

  it("returns # for non-URLs", () => {
    expect(sanitizeUrl("not a url")).toBe("#")
  })
})

describe("buildSafeParams", () => {
  it("builds URLSearchParams", () => {
    const p = buildSafeParams({ name: "test", value: 42 })
    expect(p.get("name")).toBe("test")
    expect(p.get("value")).toBe("42")
  })

  it("sanitizes values", () => {
    const p = buildSafeParams({ key: "<script>bad</script>" })
    expect(p.get("key")).not.toContain("<script>")
  })
})
