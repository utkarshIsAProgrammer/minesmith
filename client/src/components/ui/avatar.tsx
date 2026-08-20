import * as React from 'react'
import { cn } from '@/lib/utils'

interface AvatarContextValue {
  imageLoaded: boolean
  setImageLoaded: (loaded: boolean) => void
}

const AvatarContext = React.createContext<AvatarContextValue>({
  imageLoaded: false,
  setImageLoaded: () => {},
})

const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const [imageLoaded, setImageLoaded] = React.useState(false)
    return (
      <AvatarContext.Provider value={{ imageLoaded, setImageLoaded }}>
        <div
          ref={ref}
          className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary', className)}
          {...props}
        />
      </AvatarContext.Provider>
    )
  }
)
Avatar.displayName = 'Avatar'

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, ...props }, ref) => {
    const { setImageLoaded } = React.useContext(AvatarContext)
    return (
      <img
        ref={ref}
        className={cn('absolute inset-0 h-full w-full object-cover', className)}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageLoaded(false)}
        {...props}
      />
    )
  }
)
AvatarImage.displayName = 'AvatarImage'

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { imageLoaded } = React.useContext(AvatarContext)
    if (imageLoaded) return null
    return (
      <div
        ref={ref}
        className={cn('flex h-full w-full items-center justify-center rounded-full bg-secondary text-sm font-medium', className)}
        {...props}
      />
    )
  }
)
AvatarFallback.displayName = 'AvatarFallback'

export { Avatar, AvatarImage, AvatarFallback }
