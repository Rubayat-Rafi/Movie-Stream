import { Outlet } from 'react-router-dom'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { NewsTicker } from './NewsTicker'
import { PromoPopupModal } from './PromoPopupModal'

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#07090e] text-zinc-100">
      <NewsTicker />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <PromoPopupModal />
    </div>
  )
}
