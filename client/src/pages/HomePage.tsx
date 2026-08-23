import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Zap,
  TreePine,
  Ghost,
  Swords,
  Gamepad2,
  ArrowRight,
  Download,
  Brain,
  Package,
  Mountain,
  Skull,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const EXAMPLES = [
  {
    icon: <TreePine className="h-4 w-4" />,
    text: 'Amazon rainforest survival with real dangers, wildlife, extreme weather, and realistic temperature mechanics',
    color: 'text-[#6B4226]',
    bg: 'bg-[#6B4226]/10 border-[#6B4226]/20',
  },
  {
    icon: <Ghost className="h-4 w-4" />,
    text: 'Horror modpack — abandoned buildings, creepy mobs, darkness, jump scares, and atmospheric sounds',
    color: 'text-[#1B1030]',
    bg: 'bg-[#1B1030]/10 border-[#1B1030]/30',
  },
  {
    icon: <Swords className="h-4 w-4" />,
    text: 'Medieval kingdom builder with castles, knights, economy, and realistic medieval life',
    color: 'text-[#7F7F7F]',
    bg: 'bg-[#7F7F7F]/10 border-[#7F7F7F]/20',
  },
  {
    icon: <Gamepad2 className="h-4 w-4" />,
    text: 'Cozy farming simulator with animals, seasons, cooking, and a peaceful village life',
    color: 'text-[#8B8573]',
    bg: 'bg-[#8B8573]/10 border-[#8B8573]/20',
  },
]

const TEMPLATES = [
  {
    icon: <TreePine className="h-5 w-5" />,
    title: 'Jungle Survival',
    desc: 'Dense biomes, dangerous wildlife, thirst & temperature, realistic sounds',
    tags: ['Biomes', 'Mobs', 'Survival', 'Audio'],
    query: 'Dense jungle survival with realistic animals, dangerous wildlife, thirst and temperature mechanics, immersive sounds, seasonal weather, and no tree punching for a hardcore survival experience',
    color: 'text-emerald-400',
    border: 'border-emerald-500/20 hover:border-emerald-500/40',
  },
  {
    icon: <Skull className="h-5 w-5" />,
    title: 'Horror Nightmare',
    desc: 'Creepy atmosphere, hostile creatures, darkness, jumpscares',
    tags: ['Horror', 'Mobs', 'Audio', 'Atmosphere'],
    query: 'Horror modpack with creepy atmosphere, hostile mutants, darkness, jumpscares, eerie ambient sounds, realistic physics, and jump scare mechanics',
    color: 'text-purple-400',
    border: 'border-purple-500/20 hover:border-purple-500/40',
  },
  {
    icon: <Mountain className="h-5 w-5" />,
    title: 'Medieval Quest',
    desc: 'Kingdoms, castles, knights, magic, economy',
    tags: ['Medieval', 'Magic', 'Adventure', 'Structures'],
    query: 'Medieval kingdom modpack with castles, knights, swords and shields, magic system, economy, dungeons, villages, and medieval architecture',
    color: 'text-amber-400',
    border: 'border-amber-500/20 hover:border-amber-500/40',
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: 'Cozy Farm Life',
    desc: 'Farming, animals, seasons, cooking, peaceful vibes',
    tags: ['Farming', 'Animals', 'Seasons', 'Cooking'],
    query: 'Cozy farming simulator with crop growth, animal husbandry, seasonal changes, cooking recipes, peaceful village life, and cute aesthetics',
    color: 'text-pink-400',
    border: 'border-pink-500/20 hover:border-pink-500/40',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Tech Evolution',
    desc: 'Machines, automation, electricity, progression',
    tags: ['Tech', 'Automation', 'Energy', 'Progression'],
    query: 'Technology modpack with machines, automation, electricity generation, resource processing, tech progression, and industrial aesthetics',
    color: 'text-blue-400',
    border: 'border-blue-500/20 hover:border-blue-500/40',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'Vanilla+ Enhanced',
    desc: 'Quality of life, performance, subtle improvements',
    tags: ['QoL', 'Performance', 'Optimization'],
    query: 'Vanilla enhanced with quality of life improvements, performance optimization, subtle visual enhancements, better inventory management, and minimap',
    color: 'text-primary',
    border: 'border-primary/20 hover:border-primary/40',
  },
]

const STEPS = [
  {
    icon: <Brain className="h-5 w-5" />,
    title: 'Describe',
    desc: 'Tell us your dream gameplay',
  },
  {
    icon: <Zap className="h-5 w-5" />,
    title: 'AI Analyzes',
    desc: 'We find the perfect mods',
  },
  {
    icon: <Package className="h-5 w-5" />,
    title: 'Curate',
    desc: 'Review & build your pack',
  },
  {
    icon: <Download className="h-5 w-5" />,
    title: 'Download',
    desc: 'One-click .zip install',
  },
]

interface HomePageProps {
  onSend: (text: string) => void
}

export default function HomePage({ onSend }: HomePageProps) {
  const [text, setText] = useState('')
  const navigate = useNavigate()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim().length < 5) return
    onSend(text.trim())
    navigate('/chat')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleExample = (example: string) => {
    onSend(example)
    navigate('/chat')
  }

  const handleTemplate = (query: string) => {
    onSend(query)
    navigate('/chat')
  }

  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
      {/* Background gradient orbs */}
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-12"
        >
          <h1 className="text-xl sm:text-3xl lg:text-5xl font-bold tracking-tight text-foreground mb-6 leading-[1.3]">
            Describe your dream
            <br />
            <span className="text-primary">Minecraft</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Tell MineSmith what gameplay you want. Our AI finds the perfect mods
            from Modrinth and packs them for a one-click download.
          </p>

          <Button
            onClick={() => navigate('/chat')}
            variant="ghost"
            className="mt-4 gap-2 text-sm text-primary hover:text-primary/80"
          >
            Or start chatting directly
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {/* Input */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="mb-12"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden shadow-lg shadow-black/20">
            <CardContent className="p-0">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. I want Minecraft to feel like a post-apocalyptic wasteland with mutant creatures, scarce resources, and radiation zones..."
                rows={3}
                className="border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:outline-none focus:border-transparent placeholder:text-muted-foreground/60 min-h-[100px]"
              />
              <div className="flex items-center justify-between px-5 pb-4 pt-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {text.length > 0 ? `${text.length} characters` : 'Be as detailed as you want'}
                  </span>
                  {text.length === 0 && (
                    <span className="text-[10px] text-muted-foreground/40 hidden sm:inline items-center gap-1">
                      <kbd className="pixel-input px-1 py-0.5 text-[9px]">Enter</kbd> to send
                    </span>
                  )}
                </div>
                <Button
                  type="submit"
                  disabled={text.trim().length < 5}
                  className="gap-1 px-2 py-1.5 sm:px-3 sm:py-2 text-[7px] sm:text-[9px] font-bold pixel-btn" style={{ fontFamily: "'Press Start 2P', monospace" }}
                >
                  <Zap className="h-3 w-3" />
                  Build My Pack
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.form>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="mb-12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 auto-rows-fr">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="h-full"
              >
                <Card className="border-border/40 bg-secondary/30 text-center py-5 hover:border-primary/30 transition-all duration-200 h-full flex flex-col items-center justify-center hover:bg-secondary/50">
                  <CardContent className="p-4 flex flex-col items-center">
                    <div className="text-primary mb-3 group-hover:scale-110 transition-transform">
                      {step.icon}
                    </div>
                    <p className="text-sm font-bold text-foreground mb-1">{step.title}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Pack Templates */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mb-12"
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-4 font-bold">
            Quick Start Templates
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TEMPLATES.map((t, i) => (
              <motion.button
                key={t.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + i * 0.06 }}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTemplate(t.query)}
                className={`border p-4 text-left transition-all cursor-pointer group bg-card/50 hover:shadow-lg ${t.border}`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`${t.color} group-hover:scale-110 transition-transform mt-0.5`}>
                    {t.icon}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {t.tags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>
                  ))}
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-4 font-bold">
            Or try a custom description
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {EXAMPLES.map((ex, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1.3 + i * 0.08 }}
                whileHover={{ scale: 1.01, x: 2 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => handleExample(ex.text)}
                className={`flex items-start gap-2 sm:gap-3 border p-3 sm:p-4 text-left transition-all cursor-pointer group hover:shadow-md ${ex.bg}`}
              >
                <div className={`mt-0.5 shrink-0 ${ex.color} group-hover:scale-110 transition-transform`}>
                  {ex.icon}
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                  {ex.text}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
