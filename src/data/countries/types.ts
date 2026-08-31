export interface TaxBracket {
  upTo: number
  rate: number
}

export interface SocialInsuranceTier {
  upTo: number
  rate: number
}

export interface CountryConfig {
  code: string
  displayName: string
  displayNameEn: string
  language: string
  currency: {
    code: string
    symbol: string
    symbolEn: string
    locale: string
  }
  taxYear: number
  incomeTax: {
    brackets: TaxBracket[]
    creditPointValueMonthly: number
    defaultCreditPoints: number
    femaleCreditPoints: number
  }
  socialInsurance: {
    employee: SocialInsuranceTier[]
    employer: SocialInsuranceTier[]
    maxMonthly: number
  }
  vat: {
    rate: number
    effectiveFrom: string
  }
  mortgage: {
    typicalRate: number
    maxTermYears: number
  }
  pension: {
    employeeRate: number
    employerRate: number
    defaultRate: number
  }
  minimumWage: {
    monthly: number
    hourly: number
    effectiveFrom: string
  }
}
