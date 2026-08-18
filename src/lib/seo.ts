import { useEffect } from "react"

interface HreflangEntry {
  lang: string
  href: string
}

interface PageMetaOptions {
  title: string
  description: string
  canonical?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  robots?: string
  hreflangs?: HreflangEntry[]
  ogSiteName?: string
}

export function usePageMeta({
  title,
  description,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  robots = "index, follow",
  hreflangs,
  ogSiteName,
}: PageMetaOptions) {
  useEffect(() => {
    document.title = title

    setMeta("description", description)
    setMeta("robots", robots)
    if (keywords?.length) {
      setMeta("keywords", keywords.join(", "))
    }

    setOgMeta("og:title", ogTitle ?? title)
    setOgMeta("og:description", ogDescription ?? description)
    setOgMeta("og:type", "website")
    setOgMeta("og:locale", "he_IL")
    setOgMeta("og:site_name", ogSiteName ?? "הישב")

    setMeta("twitter:card", "summary")
    setMeta("twitter:title", ogTitle ?? title)
    setMeta("twitter:description", ogDescription ?? description)

    if (canonical) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
      if (!link) {
        link = document.createElement("link")
        link.rel = "canonical"
        document.head.appendChild(link)
      }
      link.href = canonical
    }

    // Remove old hreflang tags
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(el => el.remove())
    if (hreflangs?.length) {
      for (const entry of hreflangs) {
        const link = document.createElement("link")
        link.rel = "alternate"
        link.hreflang = entry.lang
        link.href = entry.href
        document.head.appendChild(link)
      }
      // x-default
      const xDefault = document.createElement("link")
      xDefault.rel = "alternate"
      xDefault.hreflang = "x-default"
      xDefault.href = canonical ?? window.location.href
      document.head.appendChild(xDefault)
    }
  }, [title, description, canonical, keywords, ogTitle, ogDescription, robots, hreflangs, ogSiteName])
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.name = name
    document.head.appendChild(el)
  }
  el.content = content
}

function setOgMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement("meta")
    el.setAttribute("property", property)
    document.head.appendChild(el)
  }
  el.content = content
}
