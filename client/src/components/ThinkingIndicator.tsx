import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Bot, Brain, Search, Package } from 'lucide-react'

const STEPS = [
  { icon: Brain, text: 'Analyzing your vision...' },
  { icon: Search, text: 'Searching Modrinth...' },
  { icon: Package, text: 'Curating perfect mods...' },
]

export default function ThinkingIndicator() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * 2500)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 justify-start"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center bg-primary/10 border border-primary/20">
        <Bot className="h-4 w-4 text-primary" />
      </div>
      <div className="border border-border/50 bg-secondary/50 px-3 sm:px-5 py-2.5 sm:py-3.5 flex items-center gap-2 sm:gap-3">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 bg-primary"
              animate={{
                scale: [1, 1.4, 1],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = STEPS[step].icon
            return <Icon className="h-3.5 w-3.5 text-primary/60" />
          })()}
          <span className="text-sm text-muted-foreground">
            {STEPS[step].text}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
