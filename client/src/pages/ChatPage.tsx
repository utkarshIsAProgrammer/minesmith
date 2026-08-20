import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Send, Layers, AlertTriangle, X, Clock, Trash2, RotateCcw, CheckSquare, Square, MessageSquare, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ModCardSkeleton } from '@/components/ui/skeleton'
import { useChatStore } from '@/store/chatStore'
import { useToast } from '@/components/ui/toast'
import ModCard from '@/components/ModCard'
import Dependencies from '@/components/Dependencies'
import ConflictWarning from '@/components/ConflictWarning'
import ThinkingIndicator from '@/components/ThinkingIndicator'

const REFINEMENT_CHIPS = [
  'Add more atmosphere mods',
  'More dangerous mobs',
  'Better survival mechanics',
  'Remove performance mods',
  'Add exploration mods',
  'More realistic sounds',
]

export default function ChatPage() {
  const {
    messages, mods, dependencies, loading, analysis, error,
    searchHistory, failedMessageIndex,
    send, retryFailedMessage, restoreHistory, clearError, clearChat, removeFromHistory, clearHistory,
    selectAll, deselectAll,
  } = useChatStore()
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [mobileView, setMobileView] = useState<'chat' | 'mods'>('chat')
  const navigate = useNavigate()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-switch to mods on mobile when mods arrive
  useEffect(() => {
    if (mods.length > 0 && !loading) {
      setMobileView('mods')
    }
  }, [mods.length, loading])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [input])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed.length < 5 || loading) return
    send(trimmed, mods.length > 0)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  const handleChip = (chip: string) => {
    if (loading) return
    send(chip, mods.length > 0)
  }

  const handleClearChat = () => {
    clearChat()
    setMobileView('chat')
    toast('Chat cleared', 'info')
  }

  // ===== Chat Panel (shared between mobile & desktop) =====
  const chatPanel = (
    <div className="flex-1 flex flex-col min-h-0 relative">
      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex items-center gap-3 px-4 py-3 bg-destructive/10 border-b border-destructive/20"
            >
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span className="text-sm text-destructive flex-1 cursor-pointer" onClick={clearError}>{error}</span>
              <button
                onClick={() => retryFailedMessage()}
                disabled={loading}
                className="p-1 text-destructive hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                title="Retry"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button onClick={clearError} className="p-1 text-destructive hover:text-foreground transition-colors cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-7 w-7 p-0 gap-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {mods.length > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Layers className="h-3 w-3" />
                <span className="text-foreground font-medium">{mods.length}</span> mods found
              </span>
            )}
          </span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHistory(!showHistory)}
            className="h-7 px-2 text-xs gap-1"
          >
            <Clock className="h-3 w-3" />
            History
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              className="h-7 px-2 text-xs gap-1 text-muted-foreground"
            >
              <RotateCcw className="h-3 w-3" />
              New Chat
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-24">
        <div className="max-w-3xl mx-auto py-6 space-y-5">
          {/* Search History Panel */}
          <AnimatePresence>
            {showHistory && searchHistory.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-4"
              >
                <div className="rounded-xl border border-border/40 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Recent Searches</p>
                    <button
                      onClick={() => { clearHistory(); toast('History cleared', 'info') }}
                      className="text-[10px] text-destructive hover:text-destructive/80 font-medium cursor-pointer"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="space-y-2">
                    {searchHistory.slice(0, 5).map((h) => (
                      <div key={h.id} className="flex items-center gap-3 group">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 justify-start h-8 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => { restoreHistory(h.id); setShowHistory(false) }}
                        >
                          <Clock className="h-3 w-3 mr-2 shrink-0" />
                          <span className="truncate">{h.query}</span>
                          <Badge variant="outline" className="ml-auto shrink-0 text-[10px]">{h.modCount} mods</Badge>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100"
                          onClick={() => removeFromHistory(h.id)}
                        >
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="popLayout">
            {messages.length === 0 && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-20"
              >
                <div className="mb-5 hidden sm:flex justify-center">
                  <div className="flex h-14 w-14 items-center justify-center bg-primary/5">
                    <MessageSquare className="h-6 w-6 text-primary/60" />
                  </div>
                </div>
                <p className="text-base font-medium text-foreground mb-2">
                  Your conversation will appear here
                </p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Type a message below or go back to the homepage to pick a template
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                  <kbd className="pixel-input px-1.5 py-0.5 text-[10px]">Enter</kbd>
                  <span>to send</span>
                  <span className="mx-1">·</span>
                  <kbd className="pixel-input px-1.5 py-0.5 text-[10px]">Shift+Enter</kbd>
                  <span>new line</span>
                </div>
              </motion.div>
            )}

            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <Avatar className="h-9 w-9 shrink-0 border border-primary/20">
                    <AvatarFallback className="bg-primary/10">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-black font-medium border border-primary'
                      : 'bg-secondary/60 border border-border/50 text-foreground'
                  }`}
                >
                  {msg.content}
                </div>

                {msg.role === 'user' && i === failedMessageIndex && (
                  <button
                    onClick={() => retryFailedMessage()}
                    disabled={loading}
                    className="self-end p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
                    title="Retry sending"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                )}

                {msg.role === 'user' && (
                  <Avatar className="h-9 w-9 shrink-0 border border-border/50">
                    <AvatarFallback className="bg-secondary">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && <ThinkingIndicator />}

          {mods.length > 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-wrap gap-2 pt-2"
            >
              {REFINEMENT_CHIPS.map((chip) => (
                <Button
                  key={chip}
                  variant="outline"
                  size="sm"
                  className="text-xs h-7 border-border/40 text-muted-foreground hover:text-foreground"
                  onClick={() => handleChip(chip)}
                >
                  {chip}
                </Button>
              ))}
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input - fixed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 z-10 border-t border-border/50 bg-background/80 backdrop-blur-xl p-4">
        <form onSubmit={handleSend} className="max-w-3xl mx-auto">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={mods.length > 0 ? "Refine your pack..." : "Describe your dream Minecraft gameplay..."}
              rows={1}
              disabled={loading}
              className="min-h-[44px] max-h-[120px] pr-20 pb-2 pixel-input focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary placeholder:whitespace-nowrap placeholder:overflow-hidden placeholder:text-ellipsis"
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              {input.length > 0 && (
                <span className="text-[10px] text-muted-foreground/50 hidden sm:inline">
                  {input.length}
                </span>
              )}
              <button
                type="submit"
                disabled={loading || input.trim().length < 5}
                className="pixel-btn px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-primary-foreground bg-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Send className="h-3 w-3" />
                Send
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )

  // ===== Mods Panel (shared between mobile & desktop) =====
  const modsPanel = (
    <div className="flex-1 overflow-y-auto bg-background/30 h-full">
      <div className="p-4 sm:p-6">
        <AnimatePresence>
          {analysis && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 mb-5"
            >
              {analysis.themes?.map((theme) => (
                <Badge key={theme} variant="success">{theme}</Badge>
              ))}
              {analysis.gameplayStyle && (
                <Badge variant="info">{analysis.gameplayStyle}</Badge>
              )}
              {analysis.difficulty && (
                <Badge variant="warning">{analysis.difficulty}</Badge>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {loading && mods.length === 0 && (
          <div className="space-y-3">
            {[0, 1, 2].map(i => (
              <ModCardSkeleton key={i} index={i} />
            ))}
          </div>
        )}

        {mods.length > 0 ? (
          <>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">
                  <span className="text-foreground font-medium">{mods.length}</span> matching mods
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { selectAll(); toast(`All ${mods.length} mods selected`, 'success') }}
                  className="h-7 text-xs gap-1.5 border-border/40"
                >
                  <CheckSquare className="h-3 w-3" />
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { deselectAll(); toast('Cart cleared', 'info') }}
                  className="h-7 text-xs gap-1.5 text-muted-foreground"
                >
                  <Square className="h-3 w-3" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {mods.map((mod, i) => (
                <ModCard key={mod.id} mod={mod} index={i} />
              ))}
            </div>

            <ConflictWarning />
            <Dependencies dependencies={dependencies} mods={mods} />
          </>
        ) : !loading ? (
          <div className="text-center py-20">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center bg-secondary">
                <Layers className="h-6 w-6 text-muted-foreground/30" />
              </div>
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              Mod suggestions will appear here
            </p>
            <p className="text-sm text-muted-foreground">
              Describe your dream gameplay to get started
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-[calc(100vh-4rem)] relative">
      {/* Desktop: side by side */}
      <div className="hidden lg:flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-border/50">
          {chatPanel}
        </div>
        {modsPanel}
      </div>

      {/* Mobile: toggle views */}
      <div className="flex lg:hidden flex-1 min-h-0 h-0">
        <AnimatePresence mode="wait">
          {mobileView === 'chat' ? (
            <motion.div
              key="chat"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {chatPanel}
            </motion.div>
          ) : (
            <motion.div
              key="mods"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex-1 flex flex-col min-h-0"
            >
              {/* Mods header with back to chat */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileView('chat')}
                    className="h-7 w-7 p-0 gap-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    <span className="text-foreground font-medium">{mods.length}</span> mods
                  </span>
                </div>
              </div>
              {modsPanel}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile toggle bubble */}
      <div className="lg:hidden fixed bottom-24 right-4 z-40">
        <AnimatePresence>
          {mods.length > 0 && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileView(mobileView === 'chat' ? 'mods' : 'chat')}
              className="pixel-btn h-12 w-12 flex items-center justify-center bg-primary text-primary-foreground cursor-pointer shadow-lg"
            >
              {mobileView === 'chat' ? (
                <Layers className="h-5 w-5" />
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              {mobileView === 'chat' && (
                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-foreground text-[10px] font-bold text-background pixel-badge">
                  {mods.length}
                </span>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
