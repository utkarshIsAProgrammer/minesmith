import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Cpu, ExternalLink, ArrowRight, ArrowLeft, Check, Loader2 } from 'lucide-react'
import { apiBase } from '@/lib/apiBase'

interface OnboardingModalProps {
  onComplete: () => void
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState<'groq' | 'ollama' | null>(null)
  const [groqKey, setGroqKey] = useState('')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'available' | 'unavailable'>('checking')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    fetch(apiBase('/api/settings/test'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'ollama' }),
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => setOllamaStatus(data.ok ? 'available' : 'unavailable'))
      .catch(() => setOllamaStatus('unavailable'))
      .finally(() => clearTimeout(timeout))
    return () => { controller.abort(); clearTimeout(timeout) }
  }, [])

  const handleSelect = async (provider: 'groq' | 'ollama') => {
    setSelected(provider)
    if (provider === 'ollama') {
      setSaving(true)
      try {
        await fetch(apiBase('/api/settings'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ provider: 'ollama' }),
        })
      } catch {}
      setSaving(false)
      localStorage.setItem('minesmith_onboarded', 'true')
      onComplete()
    } else {
      setStep(1)
    }
  }

  const handleGroqSubmit = async () => {
    if (!groqKey.trim()) return
    setSaving(true)
    try {
      await fetch(apiBase('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'groq', groqApiKey: groqKey.trim() }),
      })
    } catch {}
    setSaving(false)
    localStorage.setItem('minesmith_onboarded', 'true')
    onComplete()
  }

  const handleSkip = () => {
    localStorage.setItem('minesmith_onboarded', 'true')
    onComplete()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-[min(28rem,calc(100vw-2rem))] bg-background pixel-card"
        >
          {/* Step indicator */}
          <div className="flex items-center gap-1.5 px-4 sm:px-6 pt-4">
            {[0, 1].map(s => (
              <div
                key={s}
                className={`h-1 flex-1 transition-colors ${
                  s <= step ? 'bg-primary' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 text-center">
            <img src="/logo.svg" alt="MineSmith" className="h-12 w-12 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-foreground">Welcome to MineSmith</h1>
            <p className="text-sm text-muted-foreground mt-1">
              AI-powered Minecraft modpack builder
            </p>
          </div>

          {/* Step 0: Choose provider */}
          {step === 0 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Choose how MineSmith connects to AI:
              </p>

              <button
                onClick={() => handleSelect('groq')}
                disabled={saving}
                className="w-full flex items-center gap-4 p-4 pixel-btn bg-secondary/50 hover:bg-primary/10 cursor-pointer transition-colors text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center bg-amber-500/10 shrink-0">
                  <Zap className="h-5 w-5 text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Groq (Recommended)</p>
                  <p className="text-xs text-muted-foreground">Fast, free, cloud-based</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>

              <button
                onClick={() => handleSelect('ollama')}
                disabled={ollamaStatus === 'unavailable' || saving}
                className={`w-full flex items-center gap-4 p-4 pixel-btn cursor-pointer transition-colors text-left ${
                  ollamaStatus === 'unavailable'
                    ? 'bg-secondary/20 opacity-50 cursor-not-allowed'
                    : 'bg-secondary/50 hover:bg-primary/10'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center bg-emerald-500/10 shrink-0">
                  <Cpu className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">Ollama (Local)</p>
                  <p className="text-xs text-muted-foreground">
                    {ollamaStatus === 'checking' && (
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Detecting Ollama...
                      </span>
                    )}
                    {ollamaStatus === 'available' && 'Detected on your machine'}
                    {ollamaStatus === 'unavailable' && 'Not detected — install from ollama.com'}
                  </p>
                </div>
                {saving && selected === 'ollama' ? (
                  <Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
                ) : ollamaStatus === 'available' ? (
                  <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : null}
              </button>

              <button
                onClick={handleSkip}
                className="w-full text-center text-xs text-muted-foreground hover:text-foreground py-2 cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          )}

          {/* Step 1: Groq API key */}
          {step === 1 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Paste your free Groq API key:
              </p>

              <input
                type="password"
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGroqSubmit()}
                placeholder="gsk_..."
                autoFocus
                className="w-full pixel-input px-3 py-2.5 text-sm text-foreground focus:outline-none"
              />

              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                Get free key at console.groq.com
                <ExternalLink className="h-3 w-3" />
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="pixel-btn px-4 py-2 text-xs bg-secondary/50 text-foreground cursor-pointer flex items-center gap-1.5"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back
                </button>
                <button
                  onClick={handleGroqSubmit}
                  disabled={!groqKey.trim() || saving}
                  className="flex-1 pixel-btn px-4 py-2 text-xs bg-primary text-primary-foreground cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="h-3 w-3" /> Start Building</>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
