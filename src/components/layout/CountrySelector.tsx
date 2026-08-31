import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Globe } from "lucide-react"
import { useCountry } from "@/lib/country-context"
import { getCountry, getCountryList } from "@/data/countries"
import { useLocation, useNavigate } from "react-router-dom"

export default function CountrySelector() {
  const { country, setCountryCode } = useCountry()
  const countryList = getCountryList()
  const location = useLocation()
  const navigate = useNavigate()

  const handleChange = (code: string) => {
    setCountryCode(code)
    const selected = getCountry(code)
    const calculatorMatch = location.pathname.match(/\/calculators\/([^/]+)$/)
    if (selected && calculatorMatch) {
      const path = selected.code === "IL"
        ? `/calculators/${calculatorMatch[1]}`
        : `/${selected.language}/${selected.code.toLowerCase()}/calculators/${calculatorMatch[1]}`
      navigate(path)
    }
  }

  return (
    <Select value={country.code} onValueChange={handleChange}>
      <SelectTrigger
        className="w-auto gap-1.5 h-9 px-2.5 text-sm font-medium border-none bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted"
        aria-label="Select country"
      >
        <Globe className="w-4 h-4 shrink-0" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {countryList.map((c) => (
          <SelectItem key={c.code} value={c.code}>
            <span className="flex items-center gap-2">
              <span className="text-base leading-none">{c.currency.symbol}</span>
              {c.displayNameEn}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
