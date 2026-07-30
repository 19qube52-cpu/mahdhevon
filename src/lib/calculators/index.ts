// Israeli financial calculation logic for all 12 MVP calculators
// All results are estimates. See disclaimer on each page.

// ─── TAX CONSTANTS (2024) ─────────────────────────────────────────
const TAX_BRACKETS_2024 = [
  { upTo: 81480, rate: 0.1 },
  { upTo: 116760, rate: 0.14 },
  { upTo: 188280, rate: 0.2 },
  { upTo: 261240, rate: 0.31 },
  { upTo: 558960, rate: 0.35 },
  { upTo: Infinity, rate: 0.47 },
]
const CREDIT_POINT_VALUE_MONTHLY = 242 // NIS per point per month (2024)
const NI_THRESHOLD = 7522 // NIS/month (reduced-rate threshold)
const NI_MAX = 49030 // NIS/month (no NI above this)
const NI_LOW_RATE = 0.004 + 0.031 // NI + health reduced = 3.5%
const NI_HIGH_RATE = 0.07 + 0.05 // NI + health regular = 12%

function calcAnnualTax(annualGross: number, creditPoints: number): number {
  let tax = 0
  let prev = 0
  for (const bracket of TAX_BRACKETS_2024) {
    if (annualGross <= prev) break
    const taxable = Math.min(annualGross, bracket.upTo) - prev
    tax += taxable * bracket.rate
    prev = bracket.upTo
  }
  const creditDeduction = creditPoints * CREDIT_POINT_VALUE_MONTHLY * 12
  return Math.max(0, tax - creditDeduction)
}

function calcMonthlyNI(monthlyGross: number): number {
  const cappedGross = Math.min(monthlyGross, NI_MAX)
  if (cappedGross <= NI_THRESHOLD) {
    return cappedGross * NI_LOW_RATE
  }
  return (
    NI_THRESHOLD * NI_LOW_RATE +
    (cappedGross - NI_THRESHOLD) * NI_HIGH_RATE
  )
}

// ─── 1. Bruto to Neto ─────────────────────────────────────────────
export interface BrutoNetoInput {
  grossSalary: number
  taxCredits: number
}

export interface BrutoNetoResult {
  grossSalary: number
  incomeTax: number
  nationalInsurance: number
  netSalary: number
  effectiveTaxRate: number
  breakdown: { label: string; amount: number; negative: boolean }[]
}

export function calcBrutoNeto(input: BrutoNetoInput): BrutoNetoResult {
  const { grossSalary, taxCredits } = input
  const annualGross = grossSalary * 12
  const annualTax = calcAnnualTax(annualGross, taxCredits)
  const monthlyTax = annualTax / 12
  const monthlyNI = calcMonthlyNI(grossSalary)
  const netSalary = grossSalary - monthlyTax - monthlyNI
  const effectiveTaxRate = ((monthlyTax + monthlyNI) / grossSalary) * 100

  return {
    grossSalary,
    incomeTax: monthlyTax,
    nationalInsurance: monthlyNI,
    netSalary,
    effectiveTaxRate,
    breakdown: [
      { label: "שכר ברוטו", amount: grossSalary, negative: false },
      { label: "מס הכנסה", amount: monthlyTax, negative: true },
      { label: "ביטוח לאומי + בריאות", amount: monthlyNI, negative: true },
      { label: "שכר נטו", amount: netSalary, negative: false },
    ],
  }
}

// ─── 2. Neto to Bruto ─────────────────────────────────────────────
export interface NetoBrutoInput {
  netSalary: number
  taxCredits: number
}

export interface NetoBrutoResult {
  grossSalary: number
  incomeTax: number
  nationalInsurance: number
  netSalary: number
  effectiveTaxRate: number
}

export function calcNetoBruto(input: NetoBrutoInput): NetoBrutoResult {
  const { netSalary, taxCredits } = input
  // Iterative search for gross
  let low = netSalary
  let high = netSalary * 3
  for (let i = 0; i < 100; i++) {
    const mid = (low + high) / 2
    const result = calcBrutoNeto({ grossSalary: mid, taxCredits })
    if (Math.abs(result.netSalary - netSalary) < 0.5) {
      return {
        grossSalary: mid,
        incomeTax: result.incomeTax,
        nationalInsurance: result.nationalInsurance,
        netSalary: result.netSalary,
        effectiveTaxRate: result.effectiveTaxRate,
      }
    }
    if (result.netSalary < netSalary) low = mid
    else high = mid
  }
  const final = calcBrutoNeto({ grossSalary: (low + high) / 2, taxCredits })
  return {
    grossSalary: (low + high) / 2,
    incomeTax: final.incomeTax,
    nationalInsurance: final.nationalInsurance,
    netSalary: final.netSalary,
    effectiveTaxRate: final.effectiveTaxRate,
  }
}

// ─── 3. BMI ───────────────────────────────────────────────────────
export interface BmiInput {
  weight: number // kg
  height: number // cm
}

export interface BmiResult {
  bmi: number
  category: string
  categoryKey: "underweight" | "normal" | "overweight" | "obese1" | "obese2" | "obese3"
  idealWeightMin: number
  idealWeightMax: number
  weightToLose: number
  weightToGain: number
}

export function calcBmi(input: BmiInput): BmiResult {
  const { weight, height } = input
  const h = height / 100
  const bmi = weight / (h * h)

  const idealWeightMin = 18.5 * h * h
  const idealWeightMax = 24.9 * h * h
  const weightToLose = Math.max(0, weight - idealWeightMax)
  const weightToGain = Math.max(0, idealWeightMin - weight)

  let category: string
  let categoryKey: BmiResult["categoryKey"]
  if (bmi < 18.5) { category = "תת-משקל"; categoryKey = "underweight" }
  else if (bmi < 25) { category = "משקל תקין"; categoryKey = "normal" }
  else if (bmi < 30) { category = "עודף משקל"; categoryKey = "overweight" }
  else if (bmi < 35) { category = "השמנה דרגה 1"; categoryKey = "obese1" }
  else if (bmi < 40) { category = "השמנה דרגה 2"; categoryKey = "obese2" }
  else { category = "השמנה חולנית (דרגה 3)"; categoryKey = "obese3" }

  return { bmi, category, categoryKey, idealWeightMin, idealWeightMax, weightToLose, weightToGain }
}

// ─── 4. Mortgage ──────────────────────────────────────────────────
export interface MortgageInput {
  loanAmount: number
  interestRate: number // annual %
  loanTermYears: number
}

export interface MortgageResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  principalPercent: number
  interestPercent: number
  loanAmount: number
}

export function calcMortgage(input: MortgageInput): MortgageResult {
  const { loanAmount, interestRate, loanTermYears } = input
  const r = interestRate / 100 / 12
  const n = loanTermYears * 12

  if (r === 0) {
    const mp = loanAmount / n
    return { monthlyPayment: mp, totalPayment: loanAmount, totalInterest: 0, principalPercent: 100, interestPercent: 0, loanAmount }
  }

  const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalPayment = monthlyPayment * n
  const totalInterest = totalPayment - loanAmount

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    principalPercent: (loanAmount / totalPayment) * 100,
    interestPercent: (totalInterest / totalPayment) * 100,
    loanAmount,
  }
}

// ─── 5. Loan ──────────────────────────────────────────────────────
export interface LoanInput {
  loanAmount: number
  interestRate: number // annual %
  loanTermMonths: number
}

export interface LoanResult {
  monthlyPayment: number
  totalPayment: number
  totalInterest: number
  loanAmount: number
  interestToLoanRatio: number
}

export function calcLoan(input: LoanInput): LoanResult {
  const { loanAmount, interestRate, loanTermMonths } = input
  const r = interestRate / 100 / 12
  const n = loanTermMonths

  if (r === 0) {
    const mp = loanAmount / n
    return { monthlyPayment: mp, totalPayment: loanAmount, totalInterest: 0, loanAmount, interestToLoanRatio: 0 }
  }

  const monthlyPayment = (loanAmount * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
  const totalPayment = monthlyPayment * n
  const totalInterest = totalPayment - loanAmount

  return {
    monthlyPayment,
    totalPayment,
    totalInterest,
    loanAmount,
    interestToLoanRatio: (totalInterest / loanAmount) * 100,
  }
}

// ─── 6. Compound Interest ─────────────────────────────────────────
export interface CompoundInput {
  principal: number
  monthlyDeposit: number
  annualRate: number // %
  years: number
}

export interface CompoundResult {
  finalAmount: number
  totalDeposited: number
  totalInterest: number
  yearlyData: { year: number; balance: number; deposited: number; interest: number }[]
}

export function calcCompound(input: CompoundInput): CompoundResult {
  const { principal, monthlyDeposit, annualRate, years } = input
  const monthlyRate = annualRate / 100 / 12
  const months = years * 12

  const yearlyData: CompoundResult["yearlyData"] = []
  let balance = principal
  let totalDeposited = principal

  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyDeposit
    totalDeposited += monthlyDeposit
    if (m % 12 === 0) {
      yearlyData.push({
        year: m / 12,
        balance,
        deposited: totalDeposited,
        interest: balance - totalDeposited,
      })
    }
  }

  return {
    finalAmount: balance,
    totalDeposited,
    totalInterest: balance - totalDeposited,
    yearlyData,
  }
}

// ─── 7. VAT ───────────────────────────────────────────────────────
const VAT_RATE = 0.18 // 18% from Jan 2025

export interface VatInput {
  amount: number
  vatMode: "add" | "remove"
}

export interface VatResult {
  amountBeforeVat: number
  vatAmount: number
  amountWithVat: number
  vatRate: number
}

export function calcVat(input: VatInput): VatResult {
  const { amount, vatMode } = input
  if (vatMode === "add") {
    const vatAmount = amount * VAT_RATE
    return { amountBeforeVat: amount, vatAmount, amountWithVat: amount + vatAmount, vatRate: VAT_RATE * 100 }
  } else {
    const amountBeforeVat = amount / (1 + VAT_RATE)
    const vatAmount = amount - amountBeforeVat
    return { amountBeforeVat, vatAmount, amountWithVat: amount, vatRate: VAT_RATE * 100 }
  }
}

// ─── 8. Percentage ────────────────────────────────────────────────
export interface PercentageInput {
  calcType: "percent-of" | "what-percent" | "add-percent" | "remove-percent" | "change-percent"
  valueX: number
  valueY: number
}

export interface PercentageResult {
  result: number
  explanation: string
}

export function calcPercentage(input: PercentageInput): PercentageResult {
  const { calcType, valueX, valueY } = input
  switch (calcType) {
    case "percent-of": {
      const result = (valueX / 100) * valueY
      return { result, explanation: `${valueX}% מ-${valueY} = ${result}` }
    }
    case "what-percent": {
      const result = (valueX / valueY) * 100
      return { result, explanation: `${valueX} הוא ${result.toFixed(2)}% מ-${valueY}` }
    }
    case "add-percent": {
      const result = valueY * (1 + valueX / 100)
      return { result, explanation: `${valueY} + ${valueX}% = ${result}` }
    }
    case "remove-percent": {
      const result = valueY * (1 - valueX / 100)
      return { result, explanation: `${valueY} - ${valueX}% = ${result}` }
    }
    case "change-percent": {
      const result = ((valueY - valueX) / valueX) * 100
      return { result, explanation: `שינוי מ-${valueX} ל-${valueY} = ${result.toFixed(2)}%` }
    }
  }
}

// ─── 9. Age ───────────────────────────────────────────────────────
export interface AgeInput {
  birthDate: string // ISO date string
}

export interface AgeResult {
  years: number
  months: number
  days: number
  totalDays: number
  nextBirthday: { daysUntil: number; date: string }
  zodiacSign: string
}

export function calcAge(input: AgeInput): AgeResult {
  const birth = new Date(input.birthDate)
  const today = new Date()

  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  let days = today.getDate() - birth.getDate()

  if (days < 0) {
    months--
    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  const totalDays = Math.floor((today.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24))

  const nextYear = today.getMonth() > birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() >= birth.getDate())
    ? today.getFullYear() + 1 : today.getFullYear()
  const nextBirthdayDate = new Date(nextYear, birth.getMonth(), birth.getDate())
  const daysUntil = Math.ceil((nextBirthdayDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  const zodiacSigns = [
    { name: "גדי", start: [12, 22], end: [1, 19] },
    { name: "דלי", start: [1, 20], end: [2, 18] },
    { name: "דגים", start: [2, 19], end: [3, 20] },
    { name: "טלה", start: [3, 21], end: [4, 19] },
    { name: "שור", start: [4, 20], end: [5, 20] },
    { name: "תאומים", start: [5, 21], end: [6, 20] },
    { name: "סרטן", start: [6, 21], end: [7, 22] },
    { name: "אריה", start: [7, 23], end: [8, 22] },
    { name: "בתולה", start: [8, 23], end: [9, 22] },
    { name: "מאזניים", start: [9, 23], end: [10, 22] },
    { name: "עקרב", start: [10, 23], end: [11, 21] },
    { name: "קשת", start: [11, 22], end: [12, 21] },
  ]

  const bMonth = birth.getMonth() + 1
  const bDay = birth.getDate()
  let zodiacSign = "לא ידוע"
  for (const sign of zodiacSigns) {
    const [sm, sd] = sign.start
    const [em, ed] = sign.end
    if ((bMonth === sm && bDay >= sd) || (bMonth === em && bDay <= ed)) {
      zodiacSign = sign.name
      break
    }
  }

  return {
    years,
    months,
    days,
    totalDays,
    nextBirthday: {
      daysUntil: daysUntil === 0 ? 365 : daysUntil,
      date: nextBirthdayDate.toLocaleDateString("he-IL"),
    },
    zodiacSign,
  }
}

// ─── 10. Unemployment ─────────────────────────────────────────────
const UI_MAX_DAILY_RATE = 337 // NIS/day (2024 estimate)

export interface UnemploymentInput {
  avgSalary: number
  age: number
  dependents: "yes" | "no"
}

export interface UnemploymentResult {
  dailyBenefit: number
  monthlyBenefit: number
  eligibleDays: number
  totalBenefit: number
  isCapApplied: boolean
}

export function calcUnemployment(input: UnemploymentInput): UnemploymentResult {
  const { avgSalary, age, dependents } = input
  const dailySalary = avgSalary / 30
  const dailyBenefit = Math.min(dailySalary, UI_MAX_DAILY_RATE)
  const isCapApplied = dailySalary > UI_MAX_DAILY_RATE

  let eligibleDays: number
  if (age < 25) eligibleDays = 50
  else if (age < 35) eligibleDays = dependents === "yes" ? 87 : 70
  else if (age < 45) eligibleDays = dependents === "yes" ? 100 : 87
  else eligibleDays = 138

  const monthlyBenefit = dailyBenefit * 25
  const totalBenefit = dailyBenefit * eligibleDays

  return { dailyBenefit, monthlyBenefit, eligibleDays, totalBenefit, isCapApplied }
}

// ─── 11. Child Allowance ──────────────────────────────────────────
const CHILD_ALLOWANCE_PER_CHILD = 192 // NIS/month per child (2024)

export interface ChildAllowanceInput {
  numChildren: number
}

export interface ChildAllowanceResult {
  monthlyTotal: number
  annualTotal: number
  perChild: number
  numChildren: number
}

export function calcChildAllowance(input: ChildAllowanceInput): ChildAllowanceResult {
  const { numChildren } = input
  const monthlyTotal = numChildren * CHILD_ALLOWANCE_PER_CHILD
  return {
    monthlyTotal,
    annualTotal: monthlyTotal * 12,
    perChild: CHILD_ALLOWANCE_PER_CHILD,
    numChildren,
  }
}

// ─── 12. Tax Credit Points ────────────────────────────────────────
export interface TaxCreditPointsInput {
  gender: "male" | "female"
  maritalStatus: "single" | "married" | "divorced" | "widow"
  childrenUnder5: number
  children5to17: number
  newImmigrant: "yes" | "no"
}

export interface TaxCreditPointsResult {
  totalPoints: number
  monthlyReduction: number
  annualReduction: number
  breakdown: { label: string; points: number }[]
}

export function calcTaxCreditPoints(input: TaxCreditPointsInput): TaxCreditPointsResult {
  const { gender, maritalStatus, childrenUnder5, children5to17, newImmigrant } = input
  const breakdown: { label: string; points: number }[] = []

  const basePoints = gender === "female" ? 2.75 : 2.25
  breakdown.push({ label: gender === "female" ? "נקודת בסיס (אישה)" : "נקודת בסיס", points: basePoints })

  if (maritalStatus === "married") {
    breakdown.push({ label: "נשוי/אה", points: 0.5 })
  }
  if (maritalStatus === "widow") {
    breakdown.push({ label: "אלמן/ה", points: 1 })
  }

  if (childrenUnder5 > 0) {
    breakdown.push({ label: `${childrenUnder5} ילדים עד גיל 5 (×1.5)`, points: childrenUnder5 * 1.5 })
  }
  if (children5to17 > 0) {
    breakdown.push({ label: `${children5to17} ילדים גיל 6-17 (×1)`, points: children5to17 * 1 })
  }
  if (newImmigrant === "yes") {
    breakdown.push({ label: "עולה חדש (ממוצע 3 שנים)", points: 2 })
  }

  const totalPoints = breakdown.reduce((sum, b) => sum + b.points, 0)
  const monthlyReduction = totalPoints * CREDIT_POINT_VALUE_MONTHLY
  const annualReduction = monthlyReduction * 12

  return { totalPoints, monthlyReduction, annualReduction, breakdown }
}

// ─── 13. Pension Estimate ─────────────────────────────────────────
export interface PensionInput {
  currentAge: number
  retirementAge: number
  monthlySalary: number
  currentSavings: number
  contributionRate: number // %
  annualReturn: number // %
}
export interface PensionResult {
  monthlyPension: number
  totalSaved: number
  totalContributions: number
  replacementRate: number
  yearlyData: { year: number; balance: number }[]
}
export function calcPension(input: PensionInput): PensionResult {
  const { currentAge, retirementAge, monthlySalary, currentSavings, contributionRate, annualReturn } = input
  const yearsToRetirement = Math.max(1, retirementAge - currentAge)
  const monthlyContrib = monthlySalary * (contributionRate / 100)
  const monthlyRate = annualReturn / 100 / 12
  const months = yearsToRetirement * 12

  let balance = currentSavings
  const yearlyData: { year: number; balance: number }[] = []
  for (let m = 1; m <= months; m++) {
    balance = balance * (1 + monthlyRate) + monthlyContrib
    if (m % 12 === 0) yearlyData.push({ year: currentAge + m / 12, balance })
  }

  const totalContributions = currentSavings + monthlyContrib * months
  const PAYOUT_MONTHS = 240
  const monthlyPension = balance / PAYOUT_MONTHS
  const replacementRate = (monthlyPension / monthlySalary) * 100

  return { monthlyPension, totalSaved: balance, totalContributions, replacementRate, yearlyData }
}

// ─── 14. Self-employed Tax ────────────────────────────────────────
export interface SelfEmployedInput {
  monthlyRevenue: number
  monthlyExpenses: number
  taxCredits: number
}
export interface SelfEmployedResult {
  netIncome: number
  totalTax: number
  incomeTax: number
  niContrib: number
  effectiveRate: number
}
export function calcSelfEmployed(input: SelfEmployedInput): SelfEmployedResult {
  const { monthlyRevenue, monthlyExpenses, taxCredits } = input
  const monthlyTaxable = Math.max(0, monthlyRevenue - monthlyExpenses)
  const annualTaxable = monthlyTaxable * 12

  const incomeTaxAnnual = calcAnnualTax(annualTaxable, taxCredits)
  const incomeTax = incomeTaxAnnual / 12

  // NI for self-employed (simplified): 9.61% up to 7,522, 16.23% above
  const niBase1 = Math.min(monthlyTaxable, 7522)
  const niBase2 = Math.max(0, Math.min(monthlyTaxable, 49030) - 7522)
  const niContrib = niBase1 * 0.0961 + niBase2 * 0.1623

  const totalTax = incomeTax + niContrib
  const netIncome = monthlyTaxable - totalTax
  const effectiveRate = monthlyTaxable > 0 ? (totalTax / monthlyTaxable) * 100 : 0

  return { netIncome, totalTax, incomeTax, niContrib, effectiveRate }
}

// ─── 15. Hourly to Monthly ────────────────────────────────────────
export interface HourlyInput { hourlyRate: number; hoursPerDay: number; daysPerMonth: number }
export interface HourlyResult { hourlyRate: number; dailyRate: number; monthlyGross: number; annualGross: number; withVacation: number }
export function calcHourly(input: HourlyInput): HourlyResult {
  const { hourlyRate, hoursPerDay, daysPerMonth } = input
  const dailyRate = hourlyRate * hoursPerDay
  const monthlyGross = dailyRate * daysPerMonth
  const annualGross = monthlyGross * 12
  const VACATION_DAYS = 21
  const withVacation = annualGross + dailyRate * VACATION_DAYS
  return { hourlyRate, dailyRate, monthlyGross, annualGross, withVacation }
}

// ─── 16. Property Purchase Tax ────────────────────────────────────
const PURCHASE_TAX_FIRST = [
  { upTo: 1978745, rate: 0 },
  { upTo: 2347040, rate: 0.035 },
  { upTo: 6055695, rate: 0.05 },
  { upTo: 20185000, rate: 0.08 },
  { upTo: Infinity, rate: 0.1 },
]
const PURCHASE_TAX_ADDITIONAL = [
  { upTo: 6055695, rate: 0.08 },
  { upTo: Infinity, rate: 0.1 },
]
function calcPurchaseTaxBrackets(price: number, brackets: typeof PURCHASE_TAX_FIRST) {
  let tax = 0; let prev = 0
  for (const b of brackets) {
    if (price <= prev) break
    tax += (Math.min(price, b.upTo) - prev) * b.rate
    prev = b.upTo
  }
  return tax
}
export interface PropertyTaxInput { price: number; apartmentType: "first" | "additional" | "foreign" }
export interface PropertyTaxResult { tax: number; taxRate: number; totalCost: number; price: number; isFirstApartment: boolean }
export function calcPropertyTax(input: PropertyTaxInput): PropertyTaxResult {
  const { price, apartmentType } = input
  const isFirst = apartmentType === "first"
  const tax = isFirst
    ? calcPurchaseTaxBrackets(price, PURCHASE_TAX_FIRST)
    : calcPurchaseTaxBrackets(price, PURCHASE_TAX_ADDITIONAL)
  return { tax, taxRate: price > 0 ? (tax / price) * 100 : 0, totalCost: price + tax, price, isFirstApartment: isFirst }
}

// ─── 17. Credit Card Payoff ───────────────────────────────────────
export interface CreditCardInput { balance: number; interestRate: number; monthlyPayment: number }
export interface CreditCardResult { monthsToPayoff: number; totalInterest: number; totalPaid: number; minimumMonthly: number }
export function calcCreditCard(input: CreditCardInput): CreditCardResult {
  const { balance, interestRate, monthlyPayment } = input
  const monthlyRate = interestRate / 100 / 12
  const minPayment = Math.max(balance * 0.02, 100)
  const payment = Math.max(monthlyPayment, balance * monthlyRate + 1)

  let remaining = balance; let months = 0; let totalPaid = 0
  while (remaining > 0 && months < 600) {
    const interest = remaining * monthlyRate
    const principal = Math.min(payment - interest, remaining)
    remaining -= principal
    totalPaid += principal + interest
    months++
  }
  return { monthsToPayoff: months, totalInterest: totalPaid - balance, totalPaid, minimumMonthly: minPayment }
}

// ─── 18. Rental Yield ────────────────────────────────────────────
export interface RentalYieldInput { propertyPrice: number; monthlyRent: number; monthlyExpenses: number }
export interface RentalYieldResult { grossYield: number; netYield: number; monthlyProfit: number; annualProfit: number; breakEvenYears: number }
export function calcRentalYield(input: RentalYieldInput): RentalYieldResult {
  const { propertyPrice, monthlyRent, monthlyExpenses } = input
  const annualRent = monthlyRent * 12
  const annualExpenses = monthlyExpenses * 12
  const annualProfit = annualRent - annualExpenses
  const grossYield = (annualRent / propertyPrice) * 100
  const netYield = (annualProfit / propertyPrice) * 100
  const breakEvenYears = annualProfit > 0 ? propertyPrice / annualProfit : 999
  return { grossYield, netYield, monthlyProfit: monthlyRent - monthlyExpenses, annualProfit, breakEvenYears }
}

// ─── Calculator registry ──────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function runCalculator(id: string, input: Record<string, unknown>): Record<string, unknown> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const i = input as any
  switch (id) {
    case "bruto-neto": return calcBrutoNeto(i) as unknown as Record<string, unknown>
    case "neto-bruto": return calcNetoBruto(i) as unknown as Record<string, unknown>
    case "bmi": return calcBmi(i) as unknown as Record<string, unknown>
    case "mortgage-payment": return calcMortgage(i) as unknown as Record<string, unknown>
    case "loan-payment": return calcLoan(i) as unknown as Record<string, unknown>
    case "compound-interest": return calcCompound(i) as unknown as Record<string, unknown>
    case "vat-calculator": return calcVat(i) as unknown as Record<string, unknown>
    case "percentage": return calcPercentage(i) as unknown as Record<string, unknown>
    case "age-calculator": return calcAge(i) as unknown as Record<string, unknown>
    case "bituach-leumi-employee": return calcUnemployment(i) as unknown as Record<string, unknown>
    case "child-allowance": return calcChildAllowance(i) as unknown as Record<string, unknown>
    case "tax-credit-points": return calcTaxCreditPoints(i) as unknown as Record<string, unknown>
    case "pension-estimate": return calcPension(i) as unknown as Record<string, unknown>
    case "self-employed-tax": return calcSelfEmployed(i) as unknown as Record<string, unknown>
    case "hourly-to-monthly": return calcHourly(i) as unknown as Record<string, unknown>
    case "property-purchase-tax": return calcPropertyTax(i) as unknown as Record<string, unknown>
    case "credit-card-payoff": return calcCreditCard(i) as unknown as Record<string, unknown>
    case "rental-yield": return calcRentalYield(i) as unknown as Record<string, unknown>
    case "salary-raise": return calcSalaryRaise(i) as unknown as Record<string, unknown>
    case "rent-vs-buy": return calcRentVsBuy(i) as unknown as Record<string, unknown>
    default: return {}
  }
}

// ─── 19. Salary Raise ─────────────────────────────────────────────
export interface SalaryRaiseInput {
  currentGross: number
  newGross: number
  taxCredits: number
}
export interface SalaryRaiseResult {
  oldNet: number
  newNet: number
  netDiff: number
  grossDiff: number
  percentRaise: number
  netPercentRaise: number
  monthlyGain: number
  annualGain: number
}
export function calcSalaryRaise(input: SalaryRaiseInput): SalaryRaiseResult {
  const { currentGross, newGross, taxCredits } = input
  const oldResult = calcBrutoNeto({ grossSalary: currentGross, taxCredits })
  const newResult = calcBrutoNeto({ grossSalary: newGross, taxCredits })
  const netDiff = newResult.netSalary - oldResult.netSalary
  const grossDiff = newGross - currentGross
  return {
    oldNet: oldResult.netSalary,
    newNet: newResult.netSalary,
    netDiff,
    grossDiff,
    percentRaise: currentGross > 0 ? ((newGross - currentGross) / currentGross) * 100 : 0,
    netPercentRaise: oldResult.netSalary > 0 ? (netDiff / oldResult.netSalary) * 100 : 0,
    monthlyGain: netDiff,
    annualGain: netDiff * 12,
  }
}

// ─── 20. Rent vs Buy ─────────────────────────────────────────────
export interface RentVsBuyInput {
  propertyPrice: number
  downPayment: number
  mortgageRate: number
  mortgageYears: number
  monthlyRent: number
  annualAppreciation: number
}
export interface RentVsBuyResult {
  monthlyMortgage: number
  totalMortgageCost: number
  totalRentCost: number
  propertyValueAtEnd: number
  buyNetWorth: number
  rentNetWorth: number
  betterChoice: "buy" | "rent" | "equal"
  breakEvenYear: number
}
export function calcRentVsBuy(input: RentVsBuyInput): RentVsBuyResult {
  const { propertyPrice, downPayment, mortgageRate, mortgageYears, monthlyRent, annualAppreciation } = input
  const loanAmount = propertyPrice - downPayment
  const mortgageResult = calcMortgage({ loanAmount, interestRate: mortgageRate, loanTermYears: mortgageYears })
  const months = mortgageYears * 12
  const totalMortgageCost = mortgageResult.monthlyPayment * months + downPayment
  const totalRentCost = monthlyRent * months
  const propertyValueAtEnd = propertyPrice * Math.pow(1 + annualAppreciation / 100, mortgageYears)
  const INVESTMENT_RETURN = 0.06
  const downPaymentInvested = downPayment * Math.pow(1 + INVESTMENT_RETURN, mortgageYears)
  const monthlyDiff = (mortgageResult.monthlyPayment - monthlyRent)
  const rentSavingsInvested = Math.abs(monthlyDiff) > 0
    ? Math.abs(monthlyDiff) * ((Math.pow(1 + INVESTMENT_RETURN / 12, months) - 1) / (INVESTMENT_RETURN / 12))
    : 0
  const buyNetWorth = propertyValueAtEnd - (loanAmount * (1 - months / (mortgageYears * 12)))
  const rentNetWorth = (monthlyRent < mortgageResult.monthlyPayment)
    ? downPaymentInvested + rentSavingsInvested
    : downPaymentInvested
  let breakEvenYear = mortgageYears
  for (let y = 1; y <= mortgageYears; y++) {
    const pv = propertyPrice * Math.pow(1 + annualAppreciation / 100, y)
    const rentCum = monthlyRent * 12 * y
    const mortCum = mortgageResult.monthlyPayment * 12 * y + downPayment
    if (pv + (totalRentCost - rentCum) > mortCum) { breakEvenYear = y; break }
  }
  return {
    monthlyMortgage: mortgageResult.monthlyPayment,
    totalMortgageCost,
    totalRentCost,
    propertyValueAtEnd,
    buyNetWorth,
    rentNetWorth,
    betterChoice: buyNetWorth > rentNetWorth ? "buy" : rentNetWorth > buyNetWorth ? "rent" : "equal",
    breakEvenYear,
  }
}
