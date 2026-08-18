export interface Category {
  slug: string
  name: string
  shortName: string
  description: string
  icon: string
  color: string
  popular: boolean
}

export const categories: Category[] = [
  {
    slug: "salary-tax",
    name: "שכר, מסים ומשכורת",
    shortName: "שכר ומסים",
    description: "חישובי שכר נטו-ברוטו, מס הכנסה, נקודות זיכוי ומיסים ישירים",
    icon: "Banknote",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    popular: true,
  },
  {
    slug: "bituach-leumi",
    name: "ביטוח לאומי וזכויות",
    shortName: "ביטוח לאומי",
    description: "דמי אבטלה, קצבת ילדים, זכויות עובדים וגמלאות ביטוח לאומי",
    icon: "Shield",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
    popular: true,
  },
  {
    slug: "pension",
    name: "פנסיה ופרישה",
    shortName: "פנסיה",
    description: "חישובי קרן פנסיה, גמל, השתלמות וחסכון לגיל פרישה",
    icon: "TrendingUp",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    popular: false,
  },
  {
    slug: "mortgage-loans",
    name: "משכנתא, הלוואות ומימון",
    shortName: "משכנתא",
    description: "תשלומי משכנתא, הלוואות אישיות, ריבית דריבית ומסלולי מימון",
    icon: "Home",
    color: "bg-orange-50 text-orange-700 border-orange-200",
    popular: true,
  },
  {
    slug: "family-children",
    name: "משפחה וילדים",
    shortName: "משפחה",
    description: "קצבת ילדים, מזונות, חופשת לידה וזכויות הורים",
    icon: "Users",
    color: "bg-pink-50 text-pink-700 border-pink-200",
    popular: true,
  },
  {
    slug: "health-lifestyle",
    name: "בריאות ואורח חיים",
    shortName: "בריאות",
    description: "BMI, קלוריות, לחץ דם ומחשבוני בריאות לישראלים",
    icon: "Heart",
    color: "bg-green-50 text-green-700 border-green-200",
    popular: true,
  },
  {
    slug: "self-employed",
    name: "עצמאים ועסקים קטנים",
    shortName: "עצמאים",
    description: "מע\"מ, ניכויים, ביטוח לאומי לעצמאים ורווח נקי",
    icon: "Briefcase",
    color: "bg-yellow-50 text-yellow-700 border-yellow-200",
    popular: false,
  },
  {
    slug: "general-tools",
    name: "כלים כלליים",
    shortName: "כלים",
    description: "אחוזים, גיל, ריבית דריבית וכלים מתמטיים שימושיים",
    icon: "Calculator",
    color: "bg-gray-50 text-gray-700 border-gray-200",
    popular: false,
  },
]

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug)
}

export function getPopularCategories(): Category[] {
  return categories.filter((c) => c.popular)
}
