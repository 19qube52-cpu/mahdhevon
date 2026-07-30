import { useState } from "react"
import { formatCurrency } from "@/lib/format"
import { ChevronDown, ChevronUp } from "lucide-react"

interface AmortizationRow {
  month: number
  payment: number
  principal: number
  interest: number
  balance: number
}

interface AmortizationTableProps {
  loanAmount: number
  annualRate: number
  months: number
}

function buildTable(loanAmount: number, annualRate: number, months: number): AmortizationRow[] {
  const r = annualRate / 100 / 12
  if (r === 0) {
    const payment = loanAmount / months
    return Array.from({ length: months }, (_, i) => ({
      month: i + 1,
      payment,
      principal: payment,
      interest: 0,
      balance: Math.max(0, loanAmount - payment * (i + 1)),
    }))
  }
  const payment = (loanAmount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1)
  let balance = loanAmount
  return Array.from({ length: months }, (_, i) => {
    const interest = balance * r
    const principal = payment - interest
    balance = Math.max(0, balance - principal)
    return { month: i + 1, payment, principal, interest, balance }
  })
}

export default function AmortizationTable({ loanAmount, annualRate, months }: AmortizationTableProps) {
  const [showFull, setShowFull] = useState(false)
  const [page, setPage] = useState(0)
  const rows = buildTable(loanAmount, annualRate, months)
  const PER_PAGE = 12
  const pages = Math.ceil(rows.length / PER_PAGE)
  const visible = showFull ? rows.slice(page * PER_PAGE, (page + 1) * PER_PAGE) : rows.slice(0, 6)

  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
        <h3 className="font-semibold text-sm text-foreground">לוח תשלומים חודשי</h3>
        <button
          onClick={() => { setShowFull(!showFull); setPage(0) }}
          className="text-xs text-primary font-medium flex items-center gap-1 hover:underline"
        >
          {showFull ? "הצג פחות" : `הצג הכל (${months} חודשים)`}
          {showFull ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr>
              {["חודש", "תשלום", "קרן", "ריבית", "יתרה"].map(h => (
                <th key={h} className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => (
              <tr key={row.month} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-3 py-2 font-medium text-foreground">{row.month}</td>
                <td className="px-3 py-2 text-foreground">{formatCurrency(row.payment)}</td>
                <td className="px-3 py-2 text-success font-medium">{formatCurrency(row.principal)}</td>
                <td className="px-3 py-2 text-destructive">{formatCurrency(row.interest)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatCurrency(row.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showFull && pages > 1 && (
        <div className="flex items-center justify-center gap-2 p-3 border-t border-border">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            הקודם
          </button>
          <span className="text-xs text-muted-foreground">{page + 1} / {pages}</span>
          <button
            onClick={() => setPage(Math.min(pages - 1, page + 1))}
            disabled={page === pages - 1}
            className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted disabled:opacity-40 transition-colors"
          >
            הבא
          </button>
        </div>
      )}
    </div>
  )
}
