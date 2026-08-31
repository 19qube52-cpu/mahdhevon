import type { CountryConfig } from "./types"

export const israel: CountryConfig = {
  code: "IL",
  displayName: "ישראל",
  displayNameEn: "Israel",
  language: "he",
  currency: {
    code: "ILS",
    symbol: "₪",
    symbolEn: "ILS",
    locale: "he-IL",
  },
  taxYear: 2024,
  incomeTax: {
    brackets: [
      { upTo: 81480, rate: 0.10 },
      { upTo: 116760, rate: 0.14 },
      { upTo: 188280, rate: 0.20 },
      { upTo: 261240, rate: 0.31 },
      { upTo: 558960, rate: 0.35 },
      { upTo: Infinity, rate: 0.47 },
    ],
    creditPointValueMonthly: 242,
    defaultCreditPoints: 2.25,
    femaleCreditPoints: 2.75,
  },
  socialInsurance: {
    employee: [
      { upTo: 7522, rate: 0.035 },
      { upTo: 49030, rate: 0.12 },
      { upTo: Infinity, rate: 0 },
    ],
    employer: [
      { upTo: 7522, rate: 0.0783 },
      { upTo: 49030, rate: 0.1542 },
      { upTo: Infinity, rate: 0 },
    ],
    maxMonthly: 49030,
  },
  vat: {
    rate: 0.17,
    effectiveFrom: "2024-01-01",
  },
  mortgage: {
    typicalRate: 5.5,
    maxTermYears: 30,
  },
  pension: {
    employeeRate: 0.06,
    employerRate: 0.065,
    defaultRate: 0.06,
  },
  minimumWage: {
    monthly: 5300,
    hourly: 29.12,
    effectiveFrom: "2024-01-01",
  },
}
