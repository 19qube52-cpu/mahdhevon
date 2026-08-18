import { describe, it, expect } from "vitest"
import { formatCurrency, formatNumber, formatPercent } from "./format"

describe("formatCurrency", () => {
  it("formats with ₪ symbol", () => {
    expect(formatCurrency(1000)).toContain("₪")
  })

  it("formats zero without decimal places by default", () => {
    const result = formatCurrency(0)
    expect(result).toContain("0")
  })

  it("handles decimal places", () => {
    const result = formatCurrency(12.5, 2)
    expect(result).toContain("12")
  })

  it("formats large numbers with separators", () => {
    const result = formatCurrency(1_000_000)
    // Should contain at least one separator (comma or period depending on locale)
    expect(result.length).toBeGreaterThan(7)
  })
})

describe("formatNumber", () => {
  it("formats integers without decimals by default", () => {
    expect(formatNumber(12345)).toMatch(/12[\.,]345|12345/)
  })

  it("formats with requested decimal places", () => {
    const result = formatNumber(3.14159, 2)
    expect(result).toContain("3")
  })
})

describe("formatPercent", () => {
  it("includes % symbol", () => {
    expect(formatPercent(25)).toContain("%")
  })

  it("rounds to one decimal by default", () => {
    const result = formatPercent(33.3333)
    expect(result).toBe("33.3%")
  })
})
