let activeLocale = "he-IL"
let activeCurrency = "ILS"

export function setFormatLocale(locale: string, currency: string) {
  activeLocale = locale
  activeCurrency = currency
}

export function formatCurrency(amount: number, decimals = 0): string {
  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency: activeCurrency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat(activeLocale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPercent(num: number, decimals = 1): string {
  return `${formatNumber(num, decimals)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(activeLocale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}
