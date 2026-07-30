import { Outlet } from "react-router-dom"
import Header from "./Header"
import Footer from "./Footer"
import RateAlertBanner from "./RateAlertBanner"

export default function SiteLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <RateAlertBanner />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
