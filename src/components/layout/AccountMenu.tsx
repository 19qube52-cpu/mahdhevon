import { Link, useNavigate } from "react-router-dom"
import { User as UserIcon, LayoutDashboard, LogOut, LogIn } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function AccountMenu() {
  const { user, openAuthDialog, signOut } = useAuth()
  const navigate = useNavigate()

  if (!user) {
    return (
      <button
        onClick={() => openAuthDialog(() => toast.success("התחברת בהצלחה"))}
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        aria-label="התחברות"
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">התחברות</span>
      </button>
    )
  }

  const handleSignOut = async () => {
    await signOut()
    toast.success("התנתקת מהחשבון")
    navigate("/")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="תפריט חשבון"
        >
          <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xs font-bold">
            {user.email?.[0]?.toUpperCase() ?? <UserIcon className="w-4 h-4" />}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate text-right">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/account" className="cursor-pointer">
            <LayoutDashboard className="w-4 h-4" />
            החשבון שלי
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="w-4 h-4" />
          התנתקות
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
