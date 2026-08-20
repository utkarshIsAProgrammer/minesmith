import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, Check, X, Loader2, Eye, EyeOff, Zap, Cpu, RefreshCw } from 'lucide-react'
import { apiBase } from '@/lib/apiBase'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

interface UserSettings {
  provider: string
  groqKey: string
  groqModel: string
  ollamaUrl: string
  ollamaModel: string
}

interface SettingsDialogProps {
  open: boolean
  onClose: () => void
}

export default function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [settings, setSettings] = useState<UserSettings>({
    provider: 'groq',
    groqKey: '',
    groqModel: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'qwen3.5:9b',
  })
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [showKey, setShowKey] = useState(false)
  const [ollamaModels, setOllamaModels] = useState<string[]>([])
  const [groqModels, setGroqModels] = useState<string[]>([])
  const [fetchingModels, setFetchingModels] = useState(false)
  const [groqModel, setGroqModel] = useState('')
  const { toast } = useToast()
  const keyInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      loadSettings()
      setTestResult(null)
    }
  }, [open])

  // Focus API key input when switching to Groq
  useEffect(() => {
    if (open && settings.provider === 'groq' && keyInputRef.current && !settings.groqKey) {
      setTimeout(() => keyInputRef.current?.focus(), 100)
    }
  }, [open, settings.provider])

  async function loadSettings() {
    setLoading(true)
    try {
      const res = await fetch(apiBase('/api/settings'))
      if (res.ok) {
        const s = await res.json()
        setSettings({
          provider: s.provider || 'groq',
          groqKey: s.groqApiKey || '',
          ollamaUrl: s.ollamaBaseUrl || 'http://localhost:11434',
          ollamaModel: s.ollamaModel || 'qwen3.5:9b',
        })
        setGroqModel(s.groqModel || '')
        // Fetch models if Groq is configured
        if (s.provider === 'groq' && s.groqApiKey) {
          fetchGroqModels(s.groqApiKey)
        }
      }
    } catch {}
    setLoading(false)
  }

  async function save(updates: Partial<UserSettings>) {
    const next = { ...settings, ...updates }
    setSettings(next)
    const backend: Record<string, string> = {}
    if (updates.provider !== undefined) backend.provider = updates.provider
    if (updates.groqKey !== undefined) backend.groqApiKey = updates.groqKey
    if (updates.ollamaUrl !== undefined) backend.ollamaBaseUrl = updates.ollamaUrl
    if (updates.ollamaModel !== undefined) backend.ollamaModel = updates.ollamaModel
    if ((updates as any).groqModel !== undefined) backend.groqModel = (updates as any).groqModel
    try {
      await fetch(apiBase('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(backend),
      })
    } catch {}
  }

  async function fetchOllamaModels() {
    setFetchingModels(true)
    try {
      const res = await fetch(`${settings.ollamaUrl}/api/tags`)
      if (res.ok) {
        const data = await res.json()
        const names = (data.models || []).map((m: any) => m.name)
        setOllamaModels(names)
      }
    } catch {
      setOllamaModels([])
    }
    setFetchingModels(false)
  }

  async function fetchGroqModels(apiKey?: string) {
    const key = apiKey || settings.groqKey
    if (!key) return
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${key}` },
      })
      if (res.ok) {
        const data = await res.json()
        const models = (data.data || [])
          .filter((m: any) => m.id && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('embedding'))
          .map((m: any) => m.id)
          .sort()
        setGroqModels(models)
      }
    } catch { setGroqModels([]) }
  }

  async function test() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(apiBase('/api/settings/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: settings.provider }),
      })
      const data = await res.json()
      if (data.ok) {
        const modelCount = data.models?.length || 0
        setTestResult({ ok: true, message: `Connected! ${modelCount} model${modelCount !== 1 ? 's' : ''} available` })
        toast('Connection successful!', 'success')
        if (data.models?.length) {
          if (settings.provider === 'groq') {
            setGroqModels(data.models)
            if (data.model && !groqModel) setGroqModel(data.model)
          } else if (settings.provider === 'ollama') {
            setOllamaModels(data.models.map((m: any) => m.name || m))
          }
        }
      } else {
        setTestResult({ ok: false, message: data.error || 'Connection failed' })
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'Connection failed' })
    }
    setTesting(false)
  }

  if (!open) return null

  const isOllama = settings.provider === 'ollama'

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />
      <motion.div
        key="dialog"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div className="w-full max-w-sm bg-background pixel-card" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b-2 border-[#3f3f46]">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" />
              <span className="text-sm font-bold uppercase tracking-wider">Settings</span>
            </div>
            <button onClick={onClose} className="pixel-btn p-1 cursor-pointer">
              <X className="h-4 w-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : (
            <div className="p-5 space-y-4">

              {/* Two provider buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => save({ provider: 'groq' })}
                  className={`flex flex-col items-center gap-1.5 p-4 pixel-btn cursor-pointer transition-all ${
                    !isOllama ? 'bg-primary/10 border-primary' : 'bg-secondary/50'
                  }`}
                >
                  <Zap className={`h-5 w-5 ${!isOllama ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] font-bold uppercase ${!isOllama ? 'text-primary' : 'text-muted-foreground'}`}>Groq</span>
                  <span className="text-[9px] text-muted-foreground">Fast & Free</span>
                </button>
                <button
                  onClick={() => save({ provider: 'ollama' })}
                  className={`flex flex-col items-center gap-1.5 p-4 pixel-btn cursor-pointer transition-all ${
                    isOllama ? 'bg-primary/10 border-primary' : 'bg-secondary/50'
                  }`}
                >
                  <Cpu className={`h-5 w-5 ${isOllama ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`text-[9px] font-bold uppercase ${isOllama ? 'text-primary' : 'text-muted-foreground'}`}>Ollama</span>
                  <span className="text-[9px] text-muted-foreground">Local & Private</span>
                </button>
              </div>

              {/* Groq settings */}
              {!isOllama && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">API Key</label>
                    <div className="relative">
                      <input
                        ref={keyInputRef}
                        type={showKey ? 'text' : 'password'}
                        value={settings.groqKey}
                        onChange={(e) => setSettings({ ...settings, groqKey: e.target.value })}
                        onBlur={() => {
                          save({ groqKey: settings.groqKey })
                          if (settings.groqKey) fetchGroqModels()
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && test()}
                        placeholder="gsk_..."
                        className="w-full pixel-input pl-3 pr-9 py-2 text-sm text-foreground focus:outline-none"
                      />
                      <button
                        onClick={() => setShowKey(!showKey)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      >
                        {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <a
                      href="https://console.groq.com/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[9px] text-primary hover:underline inline-flex items-center gap-1 mt-1"
                    >
                      Get free key →
                    </a>
                  </div>
                  {groqModels.length > 0 && (
                    <div>
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Model</label>
                      <select
                        value={groqModel}
                        onChange={(e) => {
                          setGroqModel(e.target.value)
                          save({ groqModel: e.target.value } as any)
                        }}
                        className="w-full pixel-input px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
                      >
                        {groqModels.map((m: string) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Ollama settings */}
              {isOllama && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Server URL</label>
                    <input
                      type="text"
                      value={settings.ollamaUrl}
                      onChange={(e) => setSettings({ ...settings, ollamaUrl: e.target.value })}
                      onBlur={() => save({ ollamaUrl: settings.ollamaUrl })}
                      placeholder="http://localhost:11434"
                      className="w-full pixel-input px-3 py-2 text-sm text-foreground focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Model</label>
                      <button
                        onClick={fetchOllamaModels}
                        disabled={fetchingModels}
                        className="text-[9px] text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`h-2.5 w-2.5 ${fetchingModels ? 'animate-spin' : ''}`} />
                        {ollamaModels.length > 0 ? 'Refresh' : 'Detect models'}
                      </button>
                    </div>
                    {ollamaModels.length > 0 ? (
                      <select
                        value={settings.ollamaModel}
                        onChange={(e) => { setSettings({ ...settings, ollamaModel: e.target.value }); save({ ollamaModel: e.target.value }) }}
                        className="w-full pixel-input px-3 py-2 text-sm text-foreground focus:outline-none cursor-pointer"
                      >
                        {ollamaModels.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={settings.ollamaModel}
                        onChange={(e) => setSettings({ ...settings, ollamaModel: e.target.value })}
                        onBlur={() => save({ ollamaModel: settings.ollamaModel })}
                        placeholder="qwen3.5:9b"
                        className="w-full pixel-input px-3 py-2 text-sm text-foreground focus:outline-none"
                      />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Test + result */}
              <div className="flex items-center gap-2">
                <button
                  onClick={test}
                  disabled={testing}
                  className="pixel-btn px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-foreground cursor-pointer bg-secondary/50 flex items-center gap-1.5"
                >
                  {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Test Connection
                </button>
                <span className="text-[9px] text-muted-foreground/50">Auto-saves</span>
              </div>

              {testResult && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`pixel-border p-2.5 text-xs ${testResult.ok ? 'text-emerald-400 border-emerald-500/30' : 'text-destructive border-destructive/30'}`}
                >
                  {testResult.message}
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
