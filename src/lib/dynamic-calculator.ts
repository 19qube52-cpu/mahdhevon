export type FormulaNode =
  | { op: "const"; value: number }
  | { op: "input"; id: string }
  | { op: "add" | "sub" | "mul" | "div" | "min" | "max" | "pow"; args: FormulaNode[] }
  | { op: "round" | "floor" | "ceil" | "abs"; arg: FormulaNode }

export interface DynamicCalculatorDefinition {
  id: string; calculator_id: string; slug: string; title: string; category_slug: string; description: string
  status?: "draft" | "published" | "archived"; version?: number
  inputs: Array<{ id: string; label: string; type: "number" | "range"; min?: number; max?: number; step?: number; defaultValue?: number; unit?: string; helpText?: string }>
  formula: FormulaNode
  result_config: { label?: string; unit?: string; decimals?: number; prefix?: string; suffix?: string }
  content: { explanation?: string; example?: string; disclaimer?: string; faqs?: Array<{ question: string; answer: string }> }
  tests?: Array<{ name: string; inputs: Record<string, number>; expected: number }>
}

export function validateInputs(definition: DynamicCalculatorDefinition, values: Record<string, number>): Record<string, string> {
  return Object.fromEntries(definition.inputs.flatMap(input => {
    const value = values[input.id]
    if (!Number.isFinite(value)) return [[input.id, "יש להזין מספר תקין"]]
    if (input.min !== undefined && value < input.min) return [[input.id, `הערך המינימלי הוא ${input.min}`]]
    if (input.max !== undefined && value > input.max) return [[input.id, `הערך המקסימלי הוא ${input.max}`]]
    return []
  }))
}

export function resultBreakdown(value: number, unit?: string) {
  const normalized = unit?.trim()
  if (normalized === "שנים") return [{ label: "שנים", value }, { label: "ימים", value: value * 365.25 }, { label: "שעות", value: value * 8766 }, { label: "שניות", value: value * 31557600 }]
  if (normalized === "ימים") return [{ label: "ימים", value }, { label: "שעות", value: value * 24 }, { label: "דקות", value: value * 1440 }, { label: "שניות", value: value * 86400 }]
  if (normalized === "שעות") return [{ label: "שעות", value }, { label: "ימים", value: value / 24 }, { label: "דקות", value: value * 60 }, { label: "שניות", value: value * 3600 }]
  if (normalized === "דקות") return [{ label: "דקות", value }, { label: "שעות", value: value / 60 }, { label: "שניות", value: value * 60 }]
  return [{ label: normalized || "תוצאה", value }]
}

export function evaluateFormula(node: FormulaNode, values: Record<string, number>, depth = 0): number {
  if (depth > 20) throw new Error("הנוסחה מורכבת מדי")
  if (node.op === "const") return Number(node.value)
  if (node.op === "input") return Number(values[node.id] ?? 0)
  if (["round", "floor", "ceil", "abs"].includes(node.op)) {
    const value = evaluateFormula((node as Extract<FormulaNode, { arg: FormulaNode }>).arg, values, depth + 1)
    return node.op === "round" ? Math.round(value) : node.op === "floor" ? Math.floor(value) : node.op === "ceil" ? Math.ceil(value) : Math.abs(value)
  }
  const operation = node as Extract<FormulaNode, { args: FormulaNode[] }>
  const args = operation.args.map(arg => evaluateFormula(arg, values, depth + 1))
  if (operation.op === "add") return args.reduce((a, b) => a + b, 0)
  if (operation.op === "sub") return args.slice(1).reduce((a, b) => a - b, args[0] ?? 0)
  if (operation.op === "mul") return args.reduce((a, b) => a * b, 1)
  if (operation.op === "div") return args.slice(1).reduce((a, b) => b === 0 ? NaN : a / b, args[0] ?? 0)
  if (operation.op === "min") return Math.min(...args)
  if (operation.op === "max") return Math.max(...args)
  return Math.pow(args[0] ?? 0, args[1] ?? 1)
}
