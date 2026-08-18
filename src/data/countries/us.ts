import type { CountryConfig } from "./types"

export const usa: CountryConfig = {
  code: "US",
  displayName: "United States",
  displayNameEn: "United States",
  language: "en",
  currency: {
    code: "USD",
    symbol: "$",
    symbolEn: "$",
    locale: "en-US",
  },
  taxYear: 2024,
  incomeTax: {
    brackets: [
      { upTo: 11600, rate: 0.10 },
      { upTo: 47150, rate: 0.12 },
      { upTo: 100525, rate: 0.22 },
      { upTo: 191950, rate: 0.24 },
      { upTo: 243725, rate: 0.32 },
      { upTo: 609350, rate: 0.35 },
      { upTo: Infinity, rate: 0.37 },
    ],
    creditPointValueMonthly: 0,
    defaultCreditPoints: 0,
    femaleCreditPoints: 0,
  },
  socialInsurance: {
    employee: [
      { upTo: 14050, rate: 0.0765 },
      { upTo: Infinity, rate: 0.0145 }
    ],
    employer: [
      { upTo: 14050, rate: 0.0765 },
      { upTo: Infinity, rate: 0 }
    ],
    maxMonthly: Infinity,
  },
  vat: {
    rate: 0,
    effectiveFrom: "2024-01-01",
  },
  mortgage: {
    typicalRate: 6.8,
    maxTermYears: 30,
  },
  pension: {
    employeeRate: 0,
    employerRate: 0,
    defaultRate: 0.05,
  },
  minimumWage: {
    monthly: 1456,
    hourly: 7.25,
    effectiveFrom: "2024-01-01",
  },
}
