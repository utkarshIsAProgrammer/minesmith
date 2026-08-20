import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Settings } from 'lucide-react'
import { apiBase } from '@/lib/apiBase'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { useChatStore } from '@/store/chatStore'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

const LOADERS = [
  { value: 'fabric', label: 'Fabric', color: 'text-emerald-400' },
  { value: 'forge', label: 'Forge', color: 'text-orange-400' },
  { value: 'neoforge', label: 'NeoForge', color: 'text-blue-400' },
  { value: 'quilt', label: 'Quilt', color: 'text-purple-400' },
]

interface NavbarProps {
  onCartToggle: () => void
  onSettingsToggle: () => void
}

export function Navbar({ onCartToggle, onSettingsToggle }: NavbarProps) {
  const count = useCartStore((s) => s.selectedMods.size)
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { minecraftVersion, setMinecraftVersion, loader, setLoader } = useChatStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [versions, setVersions] = useState<string[]>([])
  const [versionsLoading, setVersionsLoading] = useState(true)
  const [versionType, setVersionType] = useState<'release' | 'snapshot' | 'all'>('release')

  useEffect(() => {
    async function fetchVersions() {
      setVersionsLoading(true)
      try {
        const res = await fetch(apiBase(`/api/versions?type=${versionType}&limit=80`))
        if (res.ok) {
          const data = await res.json()
          setVersions(data.map((v: any) => v.version))
        }
      } catch {
        setVersions(['1.21.4', '1.21.2', '1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.2', '1.20.1', '1.20', '1.19.4', '1.19.2', '1.18.2', '1.16.5', '1.12.2'])
      }
      setVersionsLoading(false)
    }
    fetchVersions()
  }, [versionType])

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
      {/* Grass pixel strip */}
      <div className="grass-stripe" />

      <div className="border-b-2 border-[#3f3f46]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 no-underline group shrink-0">
              <img src="/logo.svg" alt="MineSmith" className="h-8 w-8" />
              <span className="text-lg font-bold tracking-tight hidden sm:block">
                <span className="text-primary">Mine</span>
                <span className="text-foreground">Smith</span>
              </span>
            </Link>

            {/* Version + Loader selectors (center) — desktop */}
            {!isHome && (
              <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
                <div className="flex items-center gap-1.5">
                  <select
                    value={minecraftVersion}
                    onChange={(e) => setMinecraftVersion(e.target.value)}
                    disabled={versionsLoading}
                    className="pixel-input pl-3 pr-3 py-1.5 text-sm text-foreground cursor-pointer focus:outline-none disabled:opacity-50"
                  >
                    {versionsLoading ? (
                      <option>Loading...</option>
                    ) : (
                      versions.map(v => (
                        <option key={v} value={v}>MC {v}</option>
                      ))
                    )}
                  </select>
                  <div className="flex items-center pixel-input p-0.5">
                    {(['release', 'snapshot', 'all'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => setVersionType(t)}
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                          versionType === t
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center pixel-input p-0.5">
                  {LOADERS.map(l => (
                    <button
                      key={l.value}
                      onClick={() => setLoader(l.value)}
                      className={`px-3 py-1 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        loader === l.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsToggle}
                className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground pixel-btn"
                title="API Settings"
              >
                <Settings className="h-4 w-4" />
              </Button>

              {!isHome && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden h-9 w-9 p-0 pixel-btn"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                  {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={onCartToggle}
                className="relative gap-2 pixel-btn"
              >
                <ShoppingCart className="h-4 w-4" />
                <span className="hidden sm:inline">Cart</span>
                {count > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center bg-primary text-[10px] font-bold text-black pixel-badge"
                  >
                    {count}
                  </motion.span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile dropdown */}
          <AnimatePresence>
            {!isHome && mobileMenuOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden md:hidden pb-4"
              >
                <div className="flex flex-col gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Version</p>
                      <div className="flex gap-1">
                        {(['release', 'snapshot', 'all'] as const).map(t => (
                          <button
                            key={t}
                            onClick={() => setVersionType(t)}
                            className={`px-1.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer ${
                              versionType === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    <select
                      value={minecraftVersion}
                      onChange={(e) => setMinecraftVersion(e.target.value)}
                      disabled={versionsLoading}
                      className="w-full pixel-input px-3 py-2 text-sm text-foreground focus:outline-none"
                    >
                      {versionsLoading ? <option>Loading...</option> : versions.map(v => (
                        <option key={v} value={v}>MC {v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Loader</p>
                    <div className="flex gap-0">
                      {LOADERS.map(l => (
                        <button
                          key={l.value}
                          onClick={() => setLoader(l.value)}
                          className={`flex-1 px-3 py-2 text-xs font-bold uppercase transition-all ${
                            loader === l.value
                              ? 'bg-primary text-primary-foreground'
                              : 'pixel-input text-muted-foreground'
                          }`}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  )
}
