import { formatCurrency, formatPercent } from "@/lib/format"

export function getSmartTips(calculatorId: string, result: Record<string, unknown>): string[] {
  const tips: string[] = []

  switch (calculatorId) {
    case "bruto-neto":
    case "neto-bruto": {
      const r = result as { grossSalary: number; netSalary: number; incomeTax: number; effectiveTaxRate: number }
      if (r.effectiveTaxRate > 25) {
        tips.push(`שיעור הניכוי שלך (${formatPercent(r.effectiveTaxRate)}) גבוה. הפרשה גבוהה יותר לפנסיה וקרן השתלמות מפחיתה מס בצורה משמעותית.`)
      }
      if (r.grossSalary > 20000) {
        tips.push("שכר גבוה? בדוק זכאות לפריסת מס – אם יש לך הכנסות חד-פעמיות (בונוס, פיצויים), ניתן לפרוס על 6 שנים.")
      }
      if (r.grossSalary < 15000) {
        tips.push("בדוק אם אתה זכאי לזיכוי מס שלילי (מס הכנסה שלילי) – שכירים עם שכר נמוך עשויים לקבל החזר ישיר.")
      }
      tips.push("הפרשה לקרן השתלמות (10% מהמעסיק + 2.5% ממך) ניתנת לניצול אחרי 6 שנים ופטורה ממס.")
      break
    }

    case "mortgage-payment": {
      const r = result as { monthlyPayment: number; totalInterest: number; loanAmount: number; interestPercent: number }
      if (r.interestPercent > 40) {
        tips.push(`הריבית הכוללת (${formatCurrency(r.totalInterest)}) גבוהה מ-40% מההלוואה. קיצור תקופת המשכנתא ב-5 שנים יחסוך עשרות אלפי שקלים.`)
      }
      tips.push("פיצול המשכנתא ל-3 מסלולים (שליש שליש שליש: פריים, קבוע צמוד, קבוע לא צמוד) מקטין סיכון ריבית.")
      tips.push("פירעון מוקדם חלקי של 50,000-100,000 ₪ בשנים הראשונות חוסך יותר ריבית מאשר אחרי עשר שנים.")
      tips.push("קבל הצעות מ-3 בנקים לפחות. הפרש של 0.3% בריבית = עשרות אלפי שקלים לאורך 25 שנה.")
      break
    }

    case "bmi": {
      const r = result as { bmi: number; categoryKey: string }
      if (r.categoryKey === "overweight" || r.categoryKey.startsWith("obese")) {
        tips.push("ירידה של 5% ממשקל הגוף משפרת מדדי לחץ דם, סוכר ושומנים בדם בצורה ניכירת.")
        tips.push("30 דקות הליכה ביום, 5 פעמים בשבוע, מפחיתות סיכון מחלות לב ב-30% ומסייעות בירידה במשקל.")
      }
      if (r.categoryKey === "underweight") {
        tips.push("תת-משקל יכול להעיד על חוסר תזונתי. מומלץ להתייעץ עם דיאטנית קלינית.")
      }
      if (r.categoryKey === "normal") {
        tips.push("משקל תקין! שמור על אורח חיים פעיל ותזונה מאוזנת לשמירת BMI בטווח הבריא.")
      }
      break
    }

    case "compound-interest": {
      const r = result as { finalAmount: number; totalDeposited: number; totalInterest: number }
      const interestRatio = r.totalInterest / r.finalAmount
      if (interestRatio < 0.3) {
        tips.push("ריבית הדריבית מהווה פחות מ-30% מהסכום הסופי. הגדלת ההפקדה החודשית או הארכת התקופה ישפרו משמעותית את התוצאה.")
      }
      tips.push("קרן השתלמות נותנת תשואה פטורה ממס ריאלי – שווה בהחלט להגדיל הפרשה אם המעסיק מוסיף 10%.")
      tips.push("הכנסות פסיביות מריבית דריבית מוכפלות כל 10 שנים ב-7% תשואה (כלל 72). ניתן להתחיל עם כל סכום.")
      break
    }

    case "pension-estimate": {
      const r = result as { monthlyPension: number; replacementRate: number; monthlySalary?: number }
      if (r.replacementRate < 60) {
        tips.push(`שיעור ההחלפה (${formatPercent(r.replacementRate)}) נמוך מהמטרה המומלצת של 70%. הגדלת שיעור ההפרשה בכ-2% תשפר משמעותית.`)
      }
      tips.push("כל שנה שמתחילים מוקדם יותר להפריש שווה פי 4-5 יותר בפרישה בשל ריבית דריבית.")
      tips.push("בדוק אם קרן הפנסיה שלך גובה דמי ניהול נמוכים. הפרש של 0.5% בשנה שווה עשרות אלפי שקלים לאורך זמן.")
      break
    }

    case "self-employed-tax": {
      const r = result as { effectiveRate: number; netIncome: number }
      tips.push("הוצאות עסקיות מוכרות מפחיתות ישירות את בסיס המס. תיעוד קבלות חיוני – שמור על כל קבלה.")
      if (r.effectiveRate > 30) {
        tips.push(`שיעור המס האפקטיבי שלך (${formatPercent(r.effectiveRate)}) גבוה. פגישה עם רואה חשבון עשויה לחסוך אלפי שקלים.`)
      }
      tips.push("עצמאי עם הכנסה גבוהה יכול להפריש עד 16.5% מהכנסה לפנסיה בניכוי מס – חיסכון משמעותי.")
      break
    }

    case "property-purchase-tax": {
      const r = result as { tax: number; price: number; isFirstApartment: boolean }
      if (r.tax > 50000) {
        tips.push(`מס הרכישה (${formatCurrency(r.tax)}) ניתן לתשלום בפריסה. פנה לרשות המסים לאפשרות תשלומים.`)
      }
      if (!r.isFirstApartment) {
        tips.push("אם אתה מוכר דירה תוך 18 חודשים מרכישה זו, ניתן לקבל הנחה במס רכישה – פנה לרואה חשבון.")
      }
      tips.push("מס שבח בעתיד: שמור תיעוד של כל הוצאות השיפוץ. הן מפחיתות את השבח החייב במס.")
      break
    }

    case "credit-card-payoff": {
      const r = result as { totalInterest: number; monthsToPayoff: number }
      tips.push(`ריבית כוללת של ${formatCurrency(r.totalInterest)} היא כסף שאתה נותן לחברת האשראי. הכפלת התשלום החודשי תחצה את זמן הפירעון.`)
      tips.push("בדוק אפשרות להעברת חוב לכרטיס אחר עם ריבית אפס ל-12 חודשים. חברות אשראי מציעות זאת ללקוחות טובים.")
      tips.push("קבע הוראת קבע לתשלום אוטומטי גבוה מהמינימום – כך לא תצבור חוב נוסף.")
      break
    }

    case "rental-yield": {
      const r = result as { grossYield: number; netYield: number; breakEvenYears: number }
      if (r.grossYield < 3.5) {
        tips.push(`תשואה של ${formatPercent(r.grossYield, 1)} נחשבת נמוכה. השווה להשקעה חלופית – אג"ח ממשלתי נותן 4%-5% בסיכון אפס.`)
      }
      tips.push("החזרת השקעה תוך " + r.breakEvenYears.toFixed(0) + " שנים מהשכירות בלבד, ללא עליית ערך. זכור שגם עליית ערך הנכס היא חלק מהתשואה.")
      tips.push("עלויות נסתרות: ביטוח, ועד בית, תיקונים, תקופות ריקות (~5% מהזמן), ומס על שכר דירה מעל 5,471 ₪/חודש.")
      break
    }

    default:
      tips.push("בדוק את התוצאה מול יועץ מקצועי לקבלת המלצות מותאמות לך.")
  }

  return tips.slice(0, 3)
}

export function getResultSummary(calculatorId: string, result: Record<string, unknown>): string {
  switch (calculatorId) {
    case "bruto-neto":
    case "neto-bruto": {
      const r = result as { grossSalary: number; netSalary: number; effectiveTaxRate: number }
      return `שכר ברוטו ${formatCurrency(r.grossSalary)} → נטו ${formatCurrency(r.netSalary)} (ניכוי ${formatPercent(r.effectiveTaxRate)})`
    }
    case "mortgage-payment": {
      const r = result as { monthlyPayment: number; totalInterest: number }
      return `תשלום חודשי ${formatCurrency(r.monthlyPayment)}, סך ריבית ${formatCurrency(r.totalInterest)}`
    }
    case "bmi": {
      const r = result as { bmi: number; category: string }
      return `BMI ${r.bmi.toFixed(1)} — ${r.category}`
    }
    case "compound-interest": {
      const r = result as { finalAmount: number; totalDeposited: number }
      return `סכום סופי ${formatCurrency(r.finalAmount)}, רווח ${formatCurrency(r.finalAmount - r.totalDeposited)}`
    }
    case "pension-estimate": {
      const r = result as { monthlyPension: number; replacementRate: number }
      return `קצבה צפויה ${formatCurrency(r.monthlyPension)}/חודש (${formatPercent(r.replacementRate)} משכר)`
    }
    case "vat-calculator": {
      const r = result as { amountBeforeVat: number; amountWithVat: number; vatAmount: number }
      return `${formatCurrency(r.amountBeforeVat)} לפני מע"מ → ${formatCurrency(r.amountWithVat)} כולל מע"מ (${formatCurrency(r.vatAmount)})`
    }
    default: return ""
  }
}
