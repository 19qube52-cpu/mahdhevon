export function formatCurrency(amount: number, decimals = 0): string {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
}

export function formatNumber(num: number, decimals = 0): string {
  return new Intl.NumberFormat("he-IL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatPercent(num: number, decimals = 1): string {
  return `${formatNumber(num, decimals)}%`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date)
}
