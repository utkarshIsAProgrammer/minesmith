import * as React from 'react'
import { cn } from '@/lib/utils'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
className="fixed inset-y-0 right-0 z-50 h-full w-full sm:max-w-md border-l-4 border-[#3f3f46] bg-background shadow-[−4px_0_0_rgba(0,0,0,0.5)] overflow-hidden flex flex-col"
          >
            {/* Inventory top bar */}
            <div className="h-1 w-full" style={{
              background: 'linear-gradient(90deg, #5D8C3E 0%, #7EC850 50%, #5D8C3E 100%)',
            }} />
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-2 p-6 text-center sm:text-left', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn('text-lg font-bold uppercase tracking-wider text-foreground', className)} {...props} />
}

function SheetDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />
}

function SheetContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6 border-t-2 border-[#3f3f46]', className)} {...props} />
}

function SheetClose({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'absolute right-4 top-6 opacity-70 transition-opacity hover:opacity-100 focus:outline-none cursor-pointer pixel-btn p-1.5',
        className
      )}
      {...props}
    >
      <X className="h-4 w-4" />
    </button>
  )
}

export { Sheet, SheetHeader, SheetTitle, SheetDescription, SheetContent, SheetFooter, SheetClose }
