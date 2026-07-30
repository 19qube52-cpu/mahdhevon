import { useEffect } from "react"

interface PageMetaOptions {
  title: string
  description: string
  canonical?: string
  keywords?: string[]
  ogTitle?: string
  ogDescription?: string
  robots?: string
}

export function usePageMeta({
  title,
  description,
  canonical,
  keywords,
  ogTitle,
  ogDescription,
  robots = "index, follow",
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
    setOgMeta("og:site_name", "חשב לי")

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
  }, [title, description, canonical, keywords, ogTitle, ogDescription, robots])
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
