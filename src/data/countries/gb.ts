import type { CountryConfig } from "./types"

export const uk: CountryConfig = {
  code: "GB",
  displayName: "United Kingdom",
  displayNameEn: "United Kingdom",
  language: "en",
  currency: {
    code: "GBP",
    symbol: "£",
    symbolEn: "£",
    locale: "en-GB",
  },
  taxYear: 2024,
  incomeTax: {
    brackets: [
      { upTo: 12570, rate: 0 },
      { upTo: 50270, rate: 0.20 },
      { upTo: 125140, rate: 0.40 },
      { upTo: Infinity, rate: 0.45 },
    ],
    creditPointValueMonthly: 0,
    defaultCreditPoints: 0,
    femaleCreditPoints: 0,
  },
  socialInsurance: {
    employee: [
      { upTo: 1047.50, rate: 0 },
      { upTo: 4189.17, rate: 0.08 },
      { upTo: Infinity, rate: 0.02 }
    ],
    employer: [
      { upTo: 1047.50, rate: 0 },
      { upTo: Infinity, rate: 0.138 }
    ],
    maxMonthly: Infinity,
  },
  vat: {
    rate: 0.20,
    effectiveFrom: "2024-01-01",
  },
  mortgage: {
    typicalRate: 5.5,
    maxTermYears: 35,
  },
  pension: {
    employeeRate: 0,
    employerRate: 0.03,
    defaultRate: 0.05,
  },
  minimumWage: {
    monthly: 1905,
    hourly: 11.44,
    effectiveFrom: "2024-04-01",
  },
}
