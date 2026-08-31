import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { CountryProvider } from "@/lib/country-context"
import { Toaster } from "@/components/ui/sonner"
import SiteLayout from "@/components/layout/SiteLayout"
import HomePage from "@/pages/HomePage"
import CalculatorPage from "@/pages/CalculatorPage"
import CategoryPage from "@/pages/CategoryPage"
import NotFoundPage from "@/pages/NotFoundPage"
import FunCalculatorsPage from "@/pages/FunCalculatorsPage"
import CrmPage from "@/pages/CrmPage"
import AccountPage from "@/pages/AccountPage"
import SalaryPage from "@/pages/SalaryPage"
import EmbedPage from "@/pages/EmbedPage"
import EmbedDirectoryPage from "@/pages/EmbedDirectoryPage"
import ContactPage from "@/pages/ContactPage"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="hishov-theme">
      <BrowserRouter>
        <AuthProvider>
          <CountryProvider>
            <Routes>
              <Route path="/embed/:slug" element={<EmbedPage />} />
              <Route element={<SiteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/:lang/:country" element={<HomePage />} />
                <Route path="/:lang/:country/calculators/:slug" element={<CalculatorPage />} />
                <Route path="/calculators/:slug" element={<CalculatorPage />} />
                <Route path="/:lang/:country/categories/:slug" element={<CategoryPage />} />
                <Route path="/categories/:slug" element={<CategoryPage />} />
                <Route path="/fun" element={<FunCalculatorsPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/backstage" element={<CrmPage />} />
                <Route path="/salary/:slug" element={<SalaryPage />} />
                <Route path="/embed-directory" element={<EmbedDirectoryPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
            <Toaster position="top-center" richColors dir="rtl" />
          </CountryProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
