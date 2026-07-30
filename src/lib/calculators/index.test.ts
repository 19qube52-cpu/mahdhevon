import { describe, it, expect } from "vitest"
import {
  calcBrutoNeto,
  calcNetoBruto,
  calcMortgage,
} from "./index"

// ── calcBrutoNeto ──────────────────────────────────────────────────────────────

describe("calcBrutoNeto", () => {
  it("returns a net salary lower than gross", () => {
    const r = calcBrutoNeto({ grossSalary: 15000, taxCredits: 2.25 })
    expect(r.netSalary).toBeLessThan(r.grossSalary)
    expect(r.netSalary).toBeGreaterThan(0)
  })

  it("calculates effective tax rate between 0–60%", () => {
    const r = calcBrutoNeto({ grossSalary: 10000, taxCredits: 2.25 })
    expect(r.effectiveTaxRate).toBeGreaterThan(0)
    expect(r.effectiveTaxRate).toBeLessThan(60)
  })

  it("returns 4 breakdown items", () => {
    const r = calcBrutoNeto({ grossSalary: 10000, taxCredits: 2.25 })
    expect(r.breakdown).toHaveLength(4)
  })

  it("gross = net + incomeTax + nationalInsurance (within rounding)", () => {
    const r = calcBrutoNeto({ grossSalary: 25000, taxCredits: 2.25 })
    const sum = r.netSalary + r.incomeTax + r.nationalInsurance
    expect(sum).toBeCloseTo(r.grossSalary, 0)
  })

  it("minimum-wage earner pays very little income tax (under 50 ₪)", () => {
    const r = calcBrutoNeto({ grossSalary: 5571, taxCredits: 2.25 })
    expect(r.incomeTax).toBeLessThan(50)
    expect(r.netSalary).toBeGreaterThan(4000)
  })

  it("higher salary → higher effective rate (progressive tax)", () => {
    const low = calcBrutoNeto({ grossSalary: 8000, taxCredits: 2.25 })
    const high = calcBrutoNeto({ grossSalary: 50000, taxCredits: 2.25 })
    expect(high.effectiveTaxRate).toBeGreaterThan(low.effectiveTaxRate)
  })
})

// ── calcNetoBruto ──────────────────────────────────────────────────────────────

describe("calcNetoBruto", () => {
  it("returns a gross salary higher than net", () => {
    const r = calcNetoBruto({ netSalary: 10000, taxCredits: 2.25 })
    expect(r.grossSalary).toBeGreaterThan(r.netSalary)
  })

  it("round-trip: neto→bruto→neto stays within 1 shekel", () => {
    const net = 12000
    const r1 = calcNetoBruto({ netSalary: net, taxCredits: 2.25 })
    const r2 = calcBrutoNeto({ grossSalary: r1.grossSalary, taxCredits: 2.25 })
    expect(r2.netSalary).toBeCloseTo(net, 0)
  })
})

// ── calcMortgage ───────────────────────────────────────────────────────────────

describe("calcMortgage", () => {
  it("returns a positive monthly payment", () => {
    const r = calcMortgage({ loanAmount: 1_000_000, interestRate: 4, loanTermYears: 25 })
    expect(r.monthlyPayment).toBeGreaterThan(0)
  })

  it("total paid is more than principal (interest accrues)", () => {
    const r = calcMortgage({ loanAmount: 1_000_000, interestRate: 4, loanTermYears: 25 })
    expect(r.totalPayment).toBeGreaterThan(1_000_000)
  })

  it("higher rate → higher monthly payment", () => {
    const low = calcMortgage({ loanAmount: 800_000, interestRate: 3, loanTermYears: 20 })
    const high = calcMortgage({ loanAmount: 800_000, interestRate: 6, loanTermYears: 20 })
    expect(high.monthlyPayment).toBeGreaterThan(low.monthlyPayment)
  })

  it("longer term → lower monthly payment but more total interest", () => {
    const short = calcMortgage({ loanAmount: 500_000, interestRate: 4.5, loanTermYears: 15 })
    const long = calcMortgage({ loanAmount: 500_000, interestRate: 4.5, loanTermYears: 30 })
    expect(long.monthlyPayment).toBeLessThan(short.monthlyPayment)
    expect(long.totalInterest).toBeGreaterThan(short.totalInterest)
  })

  it("zero rate: total paid equals principal", () => {
    const r = calcMortgage({ loanAmount: 300_000, interestRate: 0, loanTermYears: 10 })
    expect(r.totalPayment).toBeCloseTo(300_000, 0)
  })
})
