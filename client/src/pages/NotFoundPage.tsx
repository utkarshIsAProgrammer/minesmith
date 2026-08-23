import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100dvh - 8rem)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4"
      >
        <div className="mb-6">
          <p className="text-4xl sm:text-6xl font-bold text-primary/20" style={{ fontFamily: "'Press Start 2P', monospace" }}>
            404
          </p>
        </div>
        <h1 className="text-lg font-bold text-foreground mb-2">
          This chunk doesn't exist
        </h1>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto">
          The page you're looking for has been mined out or never existed.
        </p>
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="pixel-btn px-3 sm:px-4 py-2 text-xs font-bold uppercase text-foreground bg-secondary/50 cursor-pointer flex items-center gap-1.5"
          >
            <ArrowLeft className="h-3 w-3" />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="pixel-btn px-3 sm:px-4 py-2 text-xs font-bold uppercase text-primary-foreground bg-primary cursor-pointer flex items-center gap-1.5"
          >
            <Home className="h-3 w-3" />
            Home
          </button>
        </div>
      </motion.div>
    </div>
  )
}
