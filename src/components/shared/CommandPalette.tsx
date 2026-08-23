import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calculator as CalcIcon, LayoutGrid } from "lucide-react"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator,
} from "@/components/ui/command"
import { calculators } from "@/data/calculators"
import { categories } from "@/data/categories"

interface CommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate()

  const go = (path: string) => {
    onOpenChange(false)
    navigate(path)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="חפש מחשבון, קטגוריה או כלי..." dir="rtl" />
      <CommandList>
        <CommandEmpty>לא נמצאו תוצאות.</CommandEmpty>
        <CommandGroup heading="כלים">
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="קטגוריות">
          {categories.map((cat) => (
            <CommandItem key={cat.slug} value={`קטגוריה ${cat.name}`} onSelect={() => go(`/categories/${cat.slug}`)}>
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              <span>{cat.name}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="מחשבונים">
          {calculators.map((calc) => (
            <CommandItem
              key={calc.id}
              value={`${calc.title} ${calc.keywords.join(" ")}`}
              onSelect={() => go(`/calculators/${calc.slug}`)}
            >
              <CalcIcon className="w-4 h-4 text-muted-foreground" />
              <span>{calc.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export function useCommandPalette() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])
  return { open, setOpen }
}
