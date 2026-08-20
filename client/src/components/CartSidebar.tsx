import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trash2, Download, Package, ShoppingCart, Zap,
  Link2, Cpu, HardDrive, Shield, AlertTriangle,
  Share2, Check, Copy,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import {
  Sheet, SheetHeader, SheetTitle, SheetContent,
  SheetFooter, SheetClose,
} from '@/components/ui/sheet'
import { useCartStore } from '@/store/cartStore'
import { useChatStore } from '@/store/chatStore'
import { useToast } from '@/components/ui/toast'
import { downloadPack, createPack } from '@/services/api'

interface CartSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function estimateRam(modCount: number, depCount: number): { gb: number; label: string; color: string } {
  const base = 2
  const modRam = modCount * 0.15
  const depRam = depCount * 0.05
  const total = base + modRam + depRam
  const rounded = Math.ceil(total)

  if (rounded <= 4) return { gb: rounded, label: `${rounded}GB`, color: 'text-emerald-400' }
  if (rounded <= 6) return { gb: rounded, label: `${rounded}GB`, color: 'text-amber-400' }
  return { gb: rounded, label: `${rounded}GB+`, color: 'text-red-400' }
}

function PackSummaryCard({ modCount, depCount }: { modCount: number; depCount: number }) {
  const total = modCount + depCount
  const ram = estimateRam(modCount, depCount)
  const totalSize = modCount * 2 + depCount * 1

  return (
    <div className="pixel-card overflow-hidden">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Pack Summary</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="flex h-9 w-9 items-center justify-center bg-primary/10 mx-auto mb-1.5">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <p className="text-lg font-bold text-foreground leading-none">{total}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">total files</p>
          </div>

          <div className="text-center">
            <div className="flex h-9 w-9 items-center justify-center bg-purple-500/10 mx-auto mb-1.5">
              <Cpu className="h-4 w-4 text-purple-400" />
            </div>
            <p className={`text-lg font-bold leading-none ${ram.color}`}>{ram.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">RAM needed</p>
          </div>

          <div className="text-center">
            <div className="flex h-9 w-9 items-center justify-center bg-sky-500/10 mx-auto mb-1.5">
              <HardDrive className="h-4 w-4 text-sky-400" />
            </div>
            <p className="text-lg font-bold text-foreground leading-none">~{totalSize}MB</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">download</p>
          </div>
        </div>

        {ram.gb > 4 && (
          <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
            <p className="text-[11px] text-amber-400/80">
              {ram.gb >= 6
                ? 'Heavy pack — allocate at least 6GB RAM in your launcher'
                : 'Consider allocating extra RAM in your launcher settings'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CartSidebar({ open, onOpenChange }: CartSidebarProps) {
  const { selectedMods, removeMod, clearCart, getModIds } = useCartStore()
  const { dependencies, mods, minecraftVersion, loader, sessionId } = useChatStore()
  const { toast } = useToast()
  const [downloading, setDownloading] = useState(false)
  const [downloadMode, setDownloadMode] = useState<'all' | 'deps'>('all')
  const [shareState, setShareState] = useState<'idle' | 'creating' | 'copied'>('idle')

  const cartMods = Array.from(selectedMods.values())
  const count = cartMods.length

  const selectedModIds = new Set(getModIds())
  const neededDeps = dependencies.filter(dep =>
    dep.requiredBy.some(id => selectedModIds.has(id))
  )
  const depCount = neededDeps.length

  const allDownloadIds = [
    ...getModIds(),
    ...neededDeps.filter(d => !selectedModIds.has(d.projectId)).map(d => d.projectId),
  ]

  const handleShare = async () => {
    const ids = allDownloadIds
    if (ids.length === 0) return
    setShareState('creating')
    try {
      const result = await createPack(ids, {
        name: 'MineSmith Pack',
        minecraftVersion,
        loader,
        sessionId: sessionId ?? undefined,
      })
      const shareUrl = `${window.location.origin}/pack/${result.shareSlug}`
      await navigator.clipboard.writeText(shareUrl)
      setShareState('copied')
      toast('Share link copied to clipboard!', 'success')
      setTimeout(() => setShareState('idle'), 2000)
    } catch {
      setShareState('idle')
      toast('Failed to create share link', 'error')
    }
  }

  const handleDownload = async (includeDeps: boolean) => {
    const ids = includeDeps ? allDownloadIds : getModIds()
    if (ids.length === 0) return
    setDownloading(true)
    setDownloadMode(includeDeps ? 'deps' : 'all')
    try {
      await downloadPack(ids, { minecraftVersion, loader })
      toast(`Pack downloaded successfully! (${ids.length} files)`, 'action')
    } catch {
      toast('Download failed. Please try again.', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const handleRemoveMod = (modId: string, modTitle: string) => {
    removeMod(modId)
    toast(`Removed ${modTitle}`, 'info', 2000)
  }

  const handleClearCart = () => {
    if (!window.confirm('Remove all mods from cart?')) return
    clearCart()
    toast('Cart cleared', 'info')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetClose onClick={() => onOpenChange(false)} />

      <SheetHeader className="border-b border-border/50 pb-4 pr-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center bg-primary/10">
            <Package className="h-4 w-4 text-primary" />
          </div>
          <SheetTitle>Your Pack</SheetTitle>
          {count > 0 && (
            <motion.span
              key={count}
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              className="ml-auto flex h-6 min-w-6 items-center justify-center bg-primary px-2 text-xs font-bold text-black"
            >
              {count}
            </motion.span>
          )}
        </div>
      </SheetHeader>

      <SheetContent className="flex-1 min-h-0 overflow-y-auto py-4">
        <AnimatePresence mode="popLayout">
          {count === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="flex h-16 w-16 items-center justify-center bg-secondary mb-4">
                <ShoppingCart className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground mb-1">
                No mods selected
              </p>
              <p className="text-xs text-muted-foreground/70 max-w-[200px]">
                Browse suggestions and add mods here, then download everything as a zip
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <PackSummaryCard modCount={count} depCount={depCount} />

              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
                  Mods ({count})
                </p>
                {cartMods.map((mod, i) => (
                  <motion.div
                    key={mod.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-3 pixel-card p-3 group hover:border-[#52525b] transition-colors"
                  >
                    <Avatar className="h-9 w-9 border border-border/50">
                      <AvatarImage src={mod.icon_url} alt={mod.title} />
                      <AvatarFallback className="bg-secondary text-sm">🧩</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{mod.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{mod.whySuggested}</p>
                    </div>
                    <button
                      className="h-8 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive pixel-btn cursor-pointer"
                      onClick={() => handleRemoveMod(mod.id, mod.title)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {neededDeps.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <Link2 className="h-3 w-3 text-amber-400" />
                    <p className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                      Auto-included dependencies ({depCount})
                    </p>
                  </div>
                  {neededDeps.map((dep, i) => (
                    <motion.div
                      key={dep.projectId}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (count + i) * 0.03 }}
                      className="flex items-center gap-3 pixel-card border-amber-500/20 bg-amber-500/[0.03] p-3"
                    >
                      <Avatar className="h-8 w-8 border border-amber-500/20">
                        <AvatarImage src={dep.iconUrl} alt={dep.projectName} />
                        <AvatarFallback className="bg-amber-500/10 text-xs">🔗</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium text-foreground truncate">{dep.projectName}</p>
                          <Badge variant="warning" className="text-[9px] px-1.5 py-0 shrink-0">{dep.type}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          Needed by: {dep.requiredBy.map(id => mods.find(m => m.id === id)?.title || id.slice(0, 8)).join(', ')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </SheetContent>

      {count > 0 && (
        <SheetFooter className="space-y-3">
          {depCount > 0 && (
            <Button onClick={() => handleDownload(true)} disabled={downloading} size="lg" className="w-full gap-2">
              {downloading && downloadMode === 'deps' ? (
                <><Zap className="h-4 w-4 animate-spin" /> Building zip...</>
              ) : (
                <><Download className="h-4 w-4" /> Download All + Dependencies</>
              )}
            </Button>
          )}
          <Button
            onClick={() => handleDownload(false)} disabled={downloading}
            variant={depCount > 0 ? 'outline' : 'default'} size="lg" className="w-full gap-2"
          >
            {downloading && downloadMode === 'all' ? (
              <><Zap className="h-4 w-4 animate-spin" /> Building zip...</>
            ) : (
              <><Package className="h-4 w-4" /> {depCount > 0 ? 'Download Mods Only' : 'Download All'}</>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            disabled={shareState === 'creating'}
            className="w-full gap-2"
          >
            {shareState === 'creating' ? (
              <><Zap className="h-3.5 w-3.5 animate-spin" /> Creating share link...</>
            ) : shareState === 'copied' ? (
              <><Check className="h-3.5 w-3.5 text-primary" /> Link copied!</>
            ) : (
              <><Share2 className="h-3.5 w-3.5" /> Share Pack</>
            )}
          </Button>

          <Button variant="ghost" size="sm" onClick={handleClearCart} className="w-full text-muted-foreground hover:text-destructive">
            Clear Cart
          </Button>
        </SheetFooter>
      )}
    </Sheet>
  )
}
