import { apiBase } from '@/lib/apiBase'
const BASE = apiBase('/api')

export interface GalleryImage {
  url: string
  title: string
  description: string
}

export interface Mod {
  id: string
  slug: string
  title: string
  description: string
  icon_url: string
  downloads: number
  follows: number
  categories: string[]
  versions: string[]
  date_modified: string
  source_url: string
  project_url: string
  matchScore: number
  whySuggested: string
  selectedByUser: boolean
  client_side: string
  server_side: string
  gallery: GalleryImage[]
}

export interface Dependency {
  projectId: string
  projectName: string
  projectSlug: string
  projectUrl: string
  iconUrl: string
  description: string
  type: 'required' | 'optional' | 'incompatible' | 'embedded'
  versionRequired: string | null
  requiredBy: string[]
}

export interface ConflictGroup {
  groupName: string
  mods: string[]
  description: string
}

export interface ChatResponse {
  sessionId: string
  aiResponse: string
  mods: Mod[]
  dependencies: Dependency[]
  conflicts: ConflictGroup[]
  analysis: {
    themes: string[]
    difficulty: string
    gameplayStyle: string
  }
}

export async function sendMessage(
  message: string,
  sessionId?: string,
  minecraftVersion?: string,
  loader?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sessionId, minecraftVersion, loader }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Chat failed: ${res.statusText}`)
  }
  return res.json()
}

export async function downloadPack(
  modIds: string[],
  options: { name?: string; minecraftVersion?: string; loader?: string } = {}
) {
  const res = await fetch(`${BASE}/packs/download-direct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modIds,
      name: options.name || 'MineSmith Pack',
      minecraftVersion: options.minecraftVersion || '1.20.1',
      loader: options.loader || 'fabric',
    }),
  })
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${(options.name || 'minesmith_pack').replace(/[^a-zA-Z0-9-_]/g, '_')}.zip`
  a.click()
  URL.revokeObjectURL(url)
}

export interface SharedPack {
  id: string
  share_slug: string
  name: string
  description: string
  minecraft_version: string
  mod_ids: string[]
  downloads: number
  created_at: string
  mods: Array<{
    id: string
    title: string
    description: string
    icon_url: string
    slug: string
    downloads: number
    project_url: string
  }>
}

export async function createPack(
  modIds: string[],
  options: { name?: string; description?: string; minecraftVersion?: string; loader?: string; sessionId?: string } = {}
): Promise<{ packId: string; shareSlug: string; shareUrl: string }> {
  const res = await fetch(`${BASE}/packs/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      modIds,
      name: options.name || 'MineSmith Pack',
      description: options.description || '',
      minecraftVersion: options.minecraftVersion || '1.20.1',
      loader: options.loader || 'fabric',
      sessionId: options.sessionId,
    }),
  })
  if (!res.ok) throw new Error('Failed to create pack')
  return res.json()
}

export async function getSharedPack(slug: string): Promise<SharedPack> {
  const res = await fetch(`${BASE}/packs/${slug}`)
  if (!res.ok) throw new Error('Pack not found')
  return res.json()
}

export async function downloadSharedPack(slug: string) {
  const res = await fetch(`${BASE}/packs/${slug}/download`)
  if (!res.ok) throw new Error('Download failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `minesmith_pack.zip`
  a.click()
  URL.revokeObjectURL(url)
}
