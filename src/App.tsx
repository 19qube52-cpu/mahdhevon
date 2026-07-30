import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { Toaster } from "@/components/ui/sonner"
import SiteLayout from "@/components/layout/SiteLayout"
import HomePage from "@/pages/HomePage"
import CalculatorPage from "@/pages/CalculatorPage"
import CategoryPage from "@/pages/CategoryPage"
import NotFoundPage from "@/pages/NotFoundPage"
import LetterExplainerPage from "@/pages/LetterExplainerPage"
import RightsAssistantPage from "@/pages/RightsAssistantPage"
import FunCalculatorsPage from "@/pages/FunCalculatorsPage"
import CrmPage from "@/pages/CrmPage"
import AccountPage from "@/pages/AccountPage"

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="chasav-li-theme">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<SiteLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/calculators/:slug" element={<CalculatorPage />} />
              <Route path="/categories/:slug" element={<CategoryPage />} />
              <Route path="/letter-explainer" element={<LetterExplainerPage />} />
              <Route path="/rights" element={<RightsAssistantPage />} />
              <Route path="/fun" element={<FunCalculatorsPage />} />
              <Route path="/account" element={<AccountPage />} />
              <Route path="/backstage" element={<CrmPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
          <Toaster position="top-center" richColors dir="rtl" />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
