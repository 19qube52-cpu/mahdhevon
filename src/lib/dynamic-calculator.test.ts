import { describe, expect, it } from "vitest"
import { evaluateFormula, resultBreakdown, validateInputs, type DynamicCalculatorDefinition } from "./dynamic-calculator"

const definition = {
  inputs: [{ id: "age", label: "גיל", type: "number", min: 0, max: 120 }],
} as DynamicCalculatorDefinition

describe("dynamic calculator engine", () => {
  it("evaluates nested safe formula trees", () => {
    expect(evaluateFormula({ op: "div", args: [{ op: "mul", args: [{ op: "input", id: "age" }, { op: "const", value: 365.25 }] }, { op: "const", value: 365.25 }] }, { age: 42 })).toBe(42)
  })

  it("does not return a finite result for division by zero", () => {
    expect(Number.isFinite(evaluateFormula({ op: "div", args: [{ op: "const", value: 1 }, { op: "const", value: 0 }] }, {}))).toBe(false)
  })

  it("validates lower and upper input boundaries", () => {
    expect(validateInputs(definition, { age: -1 }).age).toBeTruthy()
    expect(validateInputs(definition, { age: 121 }).age).toBeTruthy()
    expect(validateInputs(definition, { age: 40 })).toEqual({})
  })

  it("provides useful time conversions", () => {
    const breakdown = resultBreakdown(1, "שנים")
    expect(breakdown.find(item => item.label === "שעות")?.value).toBe(8766)
    expect(breakdown.find(item => item.label === "שניות")?.value).toBe(31557600)
  })
})
