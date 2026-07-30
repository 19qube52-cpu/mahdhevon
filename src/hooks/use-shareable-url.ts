import { useCallback, useEffect } from "react"
import { useSearchParams } from "react-router-dom"

export function useShareableUrl(
  onChange: (id: string, value: string | number) => void,
  inputTypes: Record<string, string>
) {
  const [searchParams, setSearchParams] = useSearchParams()

  // On mount, restore values from URL params
  useEffect(() => {
    let hasParams = false
    const newValues: Record<string, string | number> = {}
    searchParams.forEach((val, key) => {
      if (key.startsWith("_")) return
      hasParams = true
      const type = inputTypes[key]
      if (type === "number" || type === "range") {
        newValues[key] = parseFloat(val) || 0
      } else {
        newValues[key] = val
      }
    })
    if (hasParams) {
      Object.entries(newValues).forEach(([k, v]) => onChange(k, v))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update URL when values change
  const syncToUrl = useCallback(
    (vals: Record<string, string | number>) => {
      const params: Record<string, string> = {}
      Object.entries(vals).forEach(([k, v]) => {
        params[k] = String(v)
      })
      setSearchParams(params, { replace: true })
    },
    [setSearchParams]
  )

  return { syncToUrl }
}
