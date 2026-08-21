import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Download, ExternalLink, Package, Calendar, Eye,
  Loader2, AlertCircle, Hammer,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { getSharedPack, downloadSharedPack, type SharedPack } from '@/services/api'

export default function SharedPackPage() {
  const { slug } = useParams<{ slug: string }>()
  const [pack, setPack] = useState<SharedPack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    getSharedPack(slug)
      .then(setPack)
      .catch(() => setError('Pack not found'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleDownload = async () => {
    if (!slug) return
    setDownloading(true)
    try {
      await downloadSharedPack(slug)
    } catch {
      // Download failed silently
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading pack...</p>
        </div>
      </div>
    )
  }

  if (error || !pack) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-16 w-16 items-center justify-center bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <p className="text-lg font-semibold text-foreground">Pack not found</p>
          <p className="text-sm text-muted-foreground">
            This pack may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Hammer className="h-3 w-3 text-primary" />
            <span>Shared via MineSmith</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {pack.name}
          </h1>

          {pack.description && (
            <p className="text-muted-foreground text-base mb-4">
              {pack.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Badge variant="success">
              <Package className="h-3 w-3 mr-1" />
              {pack.mods?.length || pack.mod_ids.length} mods
            </Badge>
            <Badge variant="info">
              MC {pack.minecraft_version}
            </Badge>
            <span className="flex items-center gap-1">
              <Download className="h-3.5 w-3.5" />
              {pack.downloads} downloads
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(pack.created_at).toLocaleDateString()}
            </span>
          </div>
        </motion.div>

        {/* Download button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Button
            onClick={handleDownload}
            disabled={downloading}
            size="lg"
            className="w-full gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Building zip...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download Pack ({pack.mods?.length || pack.mod_ids.length} mods)
              </>
            )}
          </Button>
        </motion.div>

        <Separator className="mb-8" />

        {/* Mod list */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground mb-4">Mods in this pack</h2>

          {pack.mods?.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.04 }}
            >
              <Card className="border-border/40 hover:border-border/80 transition-colors">
                <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border border-border/50 shrink-0">
                    <AvatarImage src={mod.icon_url} alt={mod.title} />
                    <AvatarFallback className="bg-secondary text-lg">🧩</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-[15px]">
                      {mod.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
                      {mod.description}
                    </p>
                  </div>

                  <a
                    href={mod.project_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-primary transition-colors shrink-0"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}

          {/* If no mod details (old packs), show IDs */}
          {!pack.mods && pack.mod_ids.length > 0 && (
            <div className="text-sm text-muted-foreground">
              {pack.mod_ids.length} mods — <a href={`https://modrinth.com`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">View on Modrinth</a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-border/30 text-center">
          <p className="text-xs text-muted-foreground">
            Built with <span className="text-primary font-medium">MineSmith</span> — AI-powered Minecraft modpack builder
          </p>
        </div>
      </div>
    </div>
  )
}
