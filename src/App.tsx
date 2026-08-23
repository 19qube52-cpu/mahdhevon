import { lazy, Suspense } from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/sonner"
import SiteLayout from "@/components/layout/SiteLayout"

const HomePage = lazy(() => import("@/pages/HomePage"))
const CalculatorPage = lazy(() => import("@/pages/CalculatorPage"))
const CategoryPage = lazy(() => import("@/pages/CategoryPage"))
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"))
const FunCalculatorsPage = lazy(() => import("@/pages/FunCalculatorsPage"))
const CrmPage = lazy(() => import("@/pages/CrmPage"))

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chasav-li-theme">
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/calculators/:slug" element={<CalculatorPage />} />
                <Route path="/categories/:slug" element={<CategoryPage />} />
                <Route path="/fun" element={<FunCalculatorsPage />} />
                <Route path="/backstage" element={<CrmPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors dir="rtl" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
