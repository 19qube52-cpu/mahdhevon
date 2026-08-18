export { type CountryConfig, type TaxBracket, type SocialInsuranceTier } from "./types"
export { israel } from "./il"
export { usa } from "./us"
export { uk } from "./gb"

import { israel } from "./il"
import { usa } from "./us"
import { uk } from "./gb"
import type { CountryConfig } from "./types"

export const countries: Record<string, CountryConfig> = {
  IL: israel,
  US: usa,
  GB: uk,
}

export function getCountry(code: string): CountryConfig | undefined {
  return countries[code.toUpperCase()]
}

export function getDefaultCountry(): CountryConfig {
  return israel
}

export function getCountryList(): CountryConfig[] {
  return Object.values(countries).sort((a, b) => a.displayNameEn.localeCompare(b.displayNameEn))
}
