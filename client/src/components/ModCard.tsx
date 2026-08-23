import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, Plus, Check, Download, TrendingUp, ChevronDown, ChevronUp, AlertTriangle, ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCartStore } from '@/store/cartStore'
import { useChatStore } from '@/store/chatStore'
import { useToast } from '@/components/ui/toast'
import { formatDownloads } from '@/lib/utils'
import type { Mod } from '@/services/api'

function getScoreVariant(score: number): 'success' | 'warning' | 'info' {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'info'
}

interface ModCardProps {
  mod: Mod
  index: number
}

export default function ModCard({ mod, index }: ModCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [imgError, setImgError] = useState(false)
  const toggleMod = useCartStore((s) => s.toggleMod)
  const isSelected = useCartStore((s) => s.selectedMods.has(mod.id))
  const selectedMods = useCartStore((s) => s.selectedMods)
  const conflicts = useChatStore((s) => s.conflicts)
  const { toast } = useToast()

  const activeConflict = conflicts.find(group =>
    group.mods.includes(mod.slug?.toLowerCase())
  )
  const hasConflict = isActiveConflict(activeConflict, mod.slug, selectedMods)

  const gallery = mod.gallery || []

  // Keyboard navigation for gallery
  const handleGalleryKey = useCallback((e: KeyboardEvent) => {
    if (!galleryOpen || gallery.length <= 1) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      setGalleryIndex(prev => Math.max(0, prev - 1))
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      setGalleryIndex(prev => Math.min(gallery.length - 1, prev + 1))
    } else if (e.key === 'Escape') {
      setGalleryOpen(false)
    }
  }, [galleryOpen, gallery.length])

  useEffect(() => {
    if (galleryOpen) {
      window.addEventListener('keydown', handleGalleryKey)
      return () => window.removeEventListener('keydown', handleGalleryKey)
    }
  }, [galleryOpen, handleGalleryKey])

  const handleToggle = () => {
    toggleMod(mod)
    toast(
      isSelected ? `Removed ${mod.title}` : `Added ${mod.title} to cart`,
      isSelected ? 'info' : 'success',
      2000
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <div
        className={`group relative overflow-hidden transition-all ${
          isSelected
            ? 'pixel-border-active bg-primary/[0.03]'
            : 'pixel-card hover:border-[#52525b]'
        }`}
      >
        {isSelected && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
        )}

        <CardContent className="relative p-3 sm:p-5">
          {/* Header */}
          <div className="flex items-start gap-2.5 sm:gap-3.5 mb-3 sm:mb-4">
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-border/50 overflow-hidden shrink-0">
              {!imgError ? (
                <AvatarImage
                  src={mod.icon_url}
                  alt={mod.title}
                  onError={() => setImgError(true)}
                  className="object-cover"
                />
              ) : null}
              <AvatarFallback className="bg-secondary text-lg">🧩</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-foreground truncate text-[15px]">
                  {mod.title}
                </h3>
                <div className="flex items-center gap-1.5 shrink-0">
                  {hasConflict && (
                    <Badge variant="warning" className="flex-shrink-0 gap-1 text-[10px]">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      Conflict
                    </Badge>
                  )}
                  <Badge variant={getScoreVariant(mod.matchScore)} className="flex-shrink-0 font-mono">
                    {mod.matchScore}%
                  </Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                {mod.description}
              </p>
            </div>
          </div>

          {/* Why suggested */}
          <div className="rounded-lg bg-secondary/50 border border-border/30 px-3 py-2 sm:px-3.5 sm:py-2.5 mb-3 sm:mb-4 overflow-hidden">
            <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              <span className="text-primary font-medium">💡</span>{' '}
              {mod.whySuggested}
            </p>
          </div>

          {/* Gallery / Screenshots */}
          {gallery.length > 0 && (
            <div className="mb-4">
              {!galleryOpen ? (
                <button
                  onClick={() => setGalleryOpen(true)}
                  className="w-full flex items-center gap-2 bg-secondary/30 border border-border/30 px-3 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-border/60 transition-colors cursor-pointer"
                >
                  <Image className="h-3.5 w-3.5" />
                  View {gallery.length} screenshot{gallery.length > 1 ? 's' : ''}
                  <ChevronRight className="h-3 w-3 ml-auto" />
                </button>
              ) : (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden border border-border/30"
                >
                  <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
                    <div className="flex items-center gap-2 min-w-0">
                      <Image className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {gallery[galleryIndex]?.title || `Screenshot ${galleryIndex + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setGalleryIndex(Math.max(0, galleryIndex - 1))}
                        disabled={galleryIndex === 0}
                        aria-label="Previous screenshot"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground min-w-[30px] text-center">
                        {galleryIndex + 1}/{gallery.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => setGalleryIndex(Math.min(gallery.length - 1, galleryIndex + 1))}
                        disabled={galleryIndex === gallery.length - 1}
                        aria-label="Next screenshot"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 ml-0.5"
                        onClick={() => setGalleryOpen(false)}
                        aria-label="Close gallery"
                      >
                        <span className="text-sm">✕</span>
                      </Button>
                    </div>
                  </div>

                  <div className="relative bg-black/50 aspect-video">
                    <img
                      src={gallery[galleryIndex]?.url}
                      alt={gallery[galleryIndex]?.title || mod.title}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  {gallery.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 py-2 bg-secondary/30">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setGalleryIndex(i)}
                          className={`h-1.5 transition-all cursor-pointer ${
                            i === galleryIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-muted-foreground mb-3 sm:mb-4 flex-wrap">
            <span className="flex items-center gap-1 shrink-0">
              <Download className="h-3 w-3" />
              {formatDownloads(mod.downloads)}
            </span>
            <span className="h-1 w-1 bg-border shrink-0" />
            <span className="flex items-center gap-1 shrink-0">
              <TrendingUp className="h-3 w-3" />
              {formatDownloads(mod.follows)} followers
            </span>
            {mod.categories?.length > 0 && (
              <>
                <span className="h-1 w-1 bg-border shrink-0 hidden sm:block" />
                <span className="truncate max-w-[200px] sm:max-w-none">{mod.categories.slice(0, 3).join(', ')}</span>
              </>
            )}
          </div>

          {/* Expanded details */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-3 sm:mb-4"
              >
                <div className="bg-secondary/30 border border-border/30 p-4 space-y-3">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Full Description</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{mod.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground mb-1">Client Side</p>
                      <Badge variant={mod.client_side === 'required' ? 'success' : mod.client_side === 'unsupported' ? 'destructive' : 'outline'}>
                        {mod.client_side || 'unknown'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-muted-foreground mb-1">Server Side</p>
                      <Badge variant={mod.server_side === 'required' ? 'success' : mod.server_side === 'unsupported' ? 'destructive' : 'outline'}>
                        {mod.server_side || 'unknown'}
                      </Badge>
                    </div>
                  </div>
                  {mod.versions?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Available Versions</p>
                      <div className="flex flex-wrap gap-1">
                        {mod.versions.slice(0, 5).map(v => (
                          <Badge key={v} variant="outline" className="text-[10px]">{v}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 items-center">
            <Button
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={handleToggle}
              className="flex-1 min-w-0 gap-1.5"
            >
              {isSelected ? (
                <>
                  <Check className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">In Cart</span>
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">Add to Cart</span>
                </>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="gap-1.5 text-muted-foreground shrink-0 px-2"
              aria-label={expanded ? 'Show less details' : 'Show more details'}
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{expanded ? 'Less' : 'Details'}</span>
            </Button>

            <a
              href={mod.project_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
              aria-label="Open on Modrinth"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Modrinth</span>
            </a>
          </div>
        </CardContent>
      </div>
    </motion.div>
  )
}

function isActiveConflict(
  conflictGroup: { mods: string[] } | undefined,
  slug: string | undefined,
  selectedMods: Map<string, Mod>
): boolean {
  if (!conflictGroup || !slug) return false
  const lowerSlug = slug.toLowerCase()
  const otherModsInGroup = conflictGroup.mods.filter(m => m !== lowerSlug)
  return otherModsInGroup.some(m =>
    Array.from(selectedMods.values()).some(sm => sm.slug?.toLowerCase() === m)
  )
}
