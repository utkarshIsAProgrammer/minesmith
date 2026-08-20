import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/Navbar'
import HomePage from '@/pages/HomePage'
import ChatPage from '@/pages/ChatPage'
import SharedPackPage from '@/pages/SharedPackPage'
import CartSidebar from '@/components/CartSidebar'
import SettingsDialog from '@/components/SettingsDialog'
import OnboardingModal from '@/components/OnboardingModal'
import Footer from '@/components/Footer'
import BackToTop from '@/components/BackToTop'
import { ToastProvider } from '@/components/ui/toast'
import { useChatStore } from '@/store/chatStore'

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="flex-1 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

function AppContent() {
  const [cartOpen, setCartOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(() => {
    return localStorage.getItem('minesmith_onboarded') === 'true'
  })
  const send = useChatStore((s) => s.send)

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (settingsOpen) setSettingsOpen(false)
        else if (cartOpen) setCartOpen(false)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault()
        setSettingsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [settingsOpen, cartOpen])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {!onboardingDone && (
        <OnboardingModal onComplete={() => setOnboardingDone(true)} />
      )}
      <Navbar
        onCartToggle={() => setCartOpen(!cartOpen)}
        onSettingsToggle={() => setSettingsOpen(!settingsOpen)}
      />
      <PageTransition>
        <Routes>
          <Route path="/" element={<HomePage onSend={send} />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/pack/:slug" element={<SharedPackPage />} />
        </Routes>
      </PageTransition>
      <Footer />
      <CartSidebar open={cartOpen} onOpenChange={setCartOpen} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <BackToTop />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </BrowserRouter>
  )
}
