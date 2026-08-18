import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { getDefaultCountry, countries, type CountryConfig } from "@/data/countries"
import { setFormatLocale } from "@/lib/format"

interface CountryContextValue {
  country: CountryConfig
  setCountryCode: (code: string) => void
}

const CountryContext = createContext<CountryContextValue | undefined>(undefined)

export function CountryProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const [country, setCountry] = useState<CountryConfig>(getDefaultCountry())

  useEffect(() => {
    setFormatLocale(country.currency.locale, country.currency.code)
  }, [country])

  useEffect(() => {
    const routeMatch = location.pathname.match(/^\/(?:en|he)\/([^/]+)(?:\/calculators\/|\/?$)/)
    if (!routeMatch) return
    const routeCountry = countries[routeMatch[1].toUpperCase()]
    if (routeCountry) setCountry(routeCountry)
  }, [location.pathname])

  useEffect(() => {
    const stored = localStorage.getItem("country-code")
    if (stored) {
      const found = countries[stored.toUpperCase()]
      if (found) setCountry(found)
    }
  }, [])

  const setCountryCode = (code: string) => {
    localStorage.setItem("country-code", code)
    const found = countries[code.toUpperCase()]
    if (found) setCountry(found)
  }

  return (
    <CountryContext.Provider value={{ country, setCountryCode }}>
      {children}
    </CountryContext.Provider>
  )
}

export function useCountry(): CountryContextValue {
  const ctx = useContext(CountryContext)
  if (!ctx) throw new Error("useCountry must be used within CountryProvider")
  return ctx
}
