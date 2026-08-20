import { motion } from 'framer-motion'

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-shimmer bg-secondary/50 ${className}`} />
  )
}

export function ModCardSkeleton({ index = 0 }: { index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="pixel-card overflow-hidden"
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3.5 mb-4">
          <Skeleton className="h-12 w-12 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-10" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>

        {/* Why suggested */}
        <Skeleton className="h-10 w-full mb-4" />

        {/* Stats */}
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </motion.div>
  )
}

export function ThinkingSkeleton() {
  return (
    <div className="flex gap-3 justify-start">
      <Skeleton className="h-9 w-9 shrink-0" />
      <div className="space-y-2 flex-1 max-w-xs">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
    </div>
  )
}
