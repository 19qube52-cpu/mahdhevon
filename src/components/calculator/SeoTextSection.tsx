interface SeoTextSectionProps {
  html: string
}

export default function SeoTextSection({ html }: SeoTextSectionProps) {
  return (
    <article
      className="prose prose-sm max-w-none text-foreground [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mt-6 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-4 [&_h3]:mb-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pr-6 [&_ul]:space-y-1.5 [&_li]:text-muted-foreground [&_li]:text-sm [&_strong]:text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
