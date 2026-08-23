import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useChatStore } from '@/store/chatStore'
import { useCartStore } from '@/store/cartStore'

export default function ConflictWarning() {
  const conflicts = useChatStore((s) => s.conflicts)
  const selectedMods = useCartStore((s) => s.selectedMods)

  // Recalculate active conflicts whenever selectedMods changes
  const activeConflicts = conflicts.filter(group => {
    const cartSlugs = Array.from(selectedMods.values()).map(m => m.slug?.toLowerCase())
    return group.mods.filter(m => cartSlugs.includes(m)).length > 1
  })

  if (activeConflicts.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="mb-4 mt-4"
      >
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 sm:p-4">
          <div className="flex items-center gap-2 mb-2 sm:mb-3">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-amber-300">Mod Conflicts Detected</span>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {activeConflicts.map((group) => (
              <div
                key={group.groupName}
                className="rounded-lg bg-background/50 border border-amber-500/20 p-2.5 sm:p-3"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0" />
                  <span className="text-[11px] sm:text-xs font-semibold text-amber-300 truncate">{group.groupName}</span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mb-1.5 sm:mb-2 line-clamp-2">{group.description}</p>
                <div className="flex flex-wrap gap-1 sm:gap-1.5">
                  {group.mods.map((slug) => (
                    <Badge key={slug} variant="warning" className="text-[9px] sm:text-[10px]">
                      {slug}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
