import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Puzzle, ChevronDown, ChevronUp, ExternalLink, Check, Plus, AlertCircle, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useCartStore } from '@/store/cartStore'
import type { Dependency } from '@/services/api'

interface DependenciesProps {
  dependencies: Dependency[]
  mods: Array<{ id: string; title: string }>
}

export default function Dependencies({ dependencies, mods }: DependenciesProps) {
  const [expanded, setExpanded] = useState(true)
  const { addMod, isSelected } = useCartStore()

  if (!dependencies || dependencies.length === 0) return null

  const required = dependencies.filter(d => d.type === 'required')
  const optional = dependencies.filter(d => d.type === 'optional')
  const unaddedRequired = required.filter(d => !isSelected(d.projectId))

  const getModName = (id: string) => mods.find(m => m.id === id)?.title || id.slice(0, 8)

  const addAllRequired = () => {
    for (const dep of required) {
      if (!isSelected(dep.projectId)) {
        addMod({
          id: dep.projectId,
          slug: dep.projectSlug,
          title: dep.projectName,
          description: dep.description,
          icon_url: dep.iconUrl,
          downloads: 0,
          follows: 0,
          categories: [],
          versions: [],
          date_modified: '',
          source_url: '',
          project_url: dep.projectUrl,
          matchScore: 100,
          whySuggested: 'Required dependency',
          selectedByUser: false,
          client_side: '',
          server_side: '',
          gallery: [],
        })
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left mb-3 cursor-pointer group"
      >
        <Puzzle className="h-4 w-4 text-amber-400" />
        <span className="text-sm font-semibold text-foreground">
          Dependencies
        </span>
        <Badge variant="warning" className="text-[10px]">
          {required.length} required
        </Badge>
        {optional.length > 0 && (
          <Badge variant="info" className="text-[10px]">
            {optional.length} optional
          </Badge>
        )}
        <div className="ml-auto">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <Card className="border-amber-500/20 bg-amber-500/[0.03]">
              <CardContent className="p-4 space-y-3">
                {/* Batch accept button */}
                {unaddedRequired.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addAllRequired}
                    className="w-full gap-1.5 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Accept All Required ({unaddedRequired.length})
                  </Button>
                )}

                {/* Required dependencies */}
                {required.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">
                        Required
                      </span>
                    </div>
                    <div className="space-y-2">
                      {required.map(dep => (
                        <DependencyRow
                          key={dep.projectId}
                          dep={dep}
                          requiredByNames={dep.requiredBy.map(getModName)}
                          isSelected={isSelected(dep.projectId)}
                          onAdd={() => addMod({
                            id: dep.projectId,
                            slug: dep.projectSlug,
                            title: dep.projectName,
                            description: dep.description,
                            icon_url: dep.iconUrl,
                            downloads: 0,
                            follows: 0,
                            categories: [],
                            versions: [],
                            date_modified: '',
                            source_url: '',
                            project_url: dep.projectUrl,
                            matchScore: 100,
                            whySuggested: 'Required dependency',
                            selectedByUser: false,
                            client_side: '',
                            server_side: '',
                            gallery: [],
                          })}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Optional dependencies */}
                {optional.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 mt-3">
                      <Puzzle className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs font-medium text-blue-400 uppercase tracking-wider">
                        Optional
                      </span>
                    </div>
                    <div className="space-y-2">
                      {optional.map(dep => (
                        <DependencyRow
                          key={dep.projectId}
                          dep={dep}
                          requiredByNames={dep.requiredBy.map(getModName)}
                          isSelected={isSelected(dep.projectId)}
                          onAdd={() => addMod({
                            id: dep.projectId,
                            slug: dep.projectSlug,
                            title: dep.projectName,
                            description: dep.description,
                            icon_url: dep.iconUrl,
                            downloads: 0,
                            follows: 0,
                            categories: [],
                            versions: [],
                            date_modified: '',
                            source_url: '',
                            project_url: dep.projectUrl,
                            matchScore: 80,
                            whySuggested: 'Optional dependency',
                            selectedByUser: false,
                            client_side: '',
                            gallery: [],
                            server_side: '',
                          })}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DependencyRow({
  dep,
  requiredByNames,
  isSelected,
  onAdd,
}: {
  dep: Dependency
  requiredByNames: string[]
  isSelected: boolean
  onAdd: () => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-secondary/30 border border-border/30 p-3 group hover:border-border/60 transition-colors">
      <Avatar className="h-8 w-8 border border-border/50">
        <AvatarImage src={dep.iconUrl} alt={dep.projectName} />
        <AvatarFallback className="bg-secondary text-xs">🧩</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground truncate">
            {dep.projectName}
          </span>
          {dep.type === 'required' && (
            <Badge variant="warning" className="text-[9px] px-1.5 py-0">Required</Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          Needed by: <span className="text-foreground/70">{requiredByNames.join(', ')}</span>
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        {dep.projectUrl && (
          <a
            href={dep.projectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-1"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        <Button
          variant={isSelected ? 'default' : 'outline'}
          size="sm"
          onClick={onAdd}
          className="h-7 px-2.5 text-xs gap-1"
        >
          {isSelected ? (
            <>
              <Check className="h-3 w-3" />
              Added
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" />
              Add
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
