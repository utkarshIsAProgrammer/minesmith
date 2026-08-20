import { extractKeywords } from './ai.js';
import { multiSearch, getModIconUrl, getBulkDependencies, getModDetails } from './modrinth.js';

// ============================================================
// SEMANTIC KEYWORD EXPANSION
// Maps user concepts → related search terms for fuzzy matching
// ============================================================

const SYNONYM_MAP = {
  // Biomes & World
  'jungle': ['tropical', 'rainforest', 'forest', 'woodland', 'canopy', 'dense vegetation', 'wild'],
  'forest': ['woods', 'trees', 'canopy', 'grove', 'woodland', 'jungle', 'taiga'],
  'desert': ['arid', 'sand', 'wasteland', 'dune', 'dry'],
  'ocean': ['sea', 'marine', 'underwater', 'coral', 'deep sea', 'aquatic'],
  'cave': ['underground', 'cavern', 'mine', 'subterranean', 'spelunking'],
  'mountain': ['peak', 'alpine', 'highland', 'cliff', 'terrain'],
  'swamp': ['marsh', 'bog', 'wetland', 'mangrove', 'mire'],
  'nether': ['hell', 'volcanic', 'lava', 'infernal', 'fiery'],
  'end': ['void', 'dark', 'elytra', 'outer lands'],

  // Survival & Gameplay
  'survival': ['hardcore', 'difficult', 'challenging', 'realistic', 'grueling', 'tough'],
  'realistic': ['immersive', 'grounded', 'authentic', 'vanilla plus', 'natural'],
  'horror': ['creepy', 'scary', 'eerie', 'dark', 'spooky', 'unsettling', 'terror', 'nightmare'],
  'medieval': ['knight', 'castle', 'kingdom', 'fantasy', 'sword', 'shield', 'dungeon'],
  'farm': ['farming', 'agriculture', 'crops', 'harvest', 'village', 'pastoral'],
  'tech': ['technology', 'machines', 'automation', 'industrial', 'engineering', 'electricity', 'energy'],
  'magic': ['spells', 'enchantment', 'arcane', 'mystical', 'witchcraft', 'sorcery', 'thaumcraft'],

  // Mobs & Creatures
  'animals': ['creatures', 'mobs', 'wildlife', 'fauna', 'beasts', 'critters', 'fauna'],
  'dangerous': ['hostile', 'predator', 'aggressive', 'lethal', 'deadly', 'threat'],
  'realistic animals': ['naturalist', 'wildlife', 'fauna', 'creatures', 'realistic mobs'],

  // Atmosphere & Sensory
  'sounds': ['audio', 'ambiance', 'ambient', 'sound physics', 'reverb', 'acoustic'],
  'weather': ['rain', 'storms', 'tornado', 'seasons', 'climate', 'wind'],
  'temperature': ['thirst', 'heat', 'cold', 'body temperature', 'hydration', 'exhaustion', 'survival mechanics'],
  'lighting': ['shaders', 'dynamic lights', 'ambient occlusion', 'realistic lighting', 'glow'],

  // Structure & Building
  'structures': ['buildings', 'dungeons', 'temples', 'ruins', 'monuments', 'architecture'],
  'decoration': ['furniture', 'building blocks', 'aesthetic', 'cosmetic', 'interior'],
  'exploration': ['adventure', 'journey', 'travel', 'discovery', 'loot'],

  // Progression & Systems
  'progression': ['leveling', 'advancement', 'skills', 'unlock', 'tech tree', 'crafting chain'],
  'difficulty': ['hardcore', 'permadeath', 'realistic damage', 'health overhaul', 'challenge'],
  'vanilla plus': ['quality of life', 'QoL', 'improvement', 'enhancement', 'convenience'],
};

// ============================================================
// CATEGORY TAXONOMY — maps Modrinth categories → our internal categories
// ============================================================

const CATEGORY_TAXONOMY = {
  // Modrinth category → [our categories]
  'worldgen': ['biome-generation', 'exploration'],
  'world-generation': ['biome-generation', 'exploration'],
  'fabric': [], 'forge': [], 'neoforge': [], 'quilt': [], // loader tags — not content categories
  'mobs': ['realistic-mobs', 'danger'],
  'adventure': ['exploration', 'danger'],
  'utility': ['crafting-utility'],
  'optimization': ['performance'],
  'performance': ['performance'],
  'food': ['survival-overhaul'],
  'difficulty': ['survival-overhaul', 'difficulty'],
  'decoration': ['decoration', 'biome-generation'],
  'storage': ['crafting-utility'],
  'equipment': ['survival-overhaul'],
  'armor': ['survival-overhaul'],
  'weapons': ['danger'],
  'cursed': ['danger'],
  'qol': ['crafting-utility'],
  'magic': ['magic'],
  'technology': ['technology'],
  'library': [],
  'api': [],
  'fabric-api': [],
  'forge-api': [],
  'datapack': ['biome-generation', 'exploration'],
};

// ============================================================
// CATEGORY POPULARITY — for normalizing download counts
// ============================================================

const CATEGORY_AVG_DOWNLOADS = {
  'biome-generation': 5_000_000,
  'realistic-mobs': 3_000_000,
  'survival-overhaul': 1_500_000,
  'immersive-audio': 5_000_000,
  'weather-effects': 2_000_000,
  'crafting-utility': 10_000_000,
  'performance': 15_000_000,
  'exploration': 2_000_000,
  'danger': 1_000_000,
  'decoration': 2_000_000,
  'technology': 2_000_000,
  'magic': 1_500_000,
  'realism': 1_000_000,
  'temperature': 1_000_000,
  'creatures': 2_000_000,
  'plants': 1_000_000,
  'no-tree-punching': 2_000_000,
};

// ============================================================
// CATEGORY SEARCH BOOSTS — curated mod names per category
// ============================================================

const CATEGORY_SEARCH_BOOSTS = {
  'survival-overhaul': ['tough as nails', 'firstaid', 'realistic survival', 'survival difficulty', 'thirst', 'temperature'],
  'realistic-mobs': ['alexs mobs', 'naturalist', 'untamed wilds', 'realistic animals', 'ecologics', 'wilder wild', 'creatures and beasts', 'friends and foes', 'mob variant'],
  'biome-generation': ['biomes o plenty', 'regions unexplored', 'terralith', 'biome worldgen', 'geophilic', 'oh the biomes', 'cave biome', 'nether biome'],
  'weather-effects': ['weather storms tornadoes', 'serene seasons', 'seasons', 'realistic weather', 'better weather'],
  'immersive-audio': ['ambient sounds', 'sound physics remastered', 'serene sounds', 'realistic sounds', 'wilder wild', 'echo particles'],
  'difficulty': ['hardcore mode', 'permadeath', 'realistic damage', 'health overhaul', 'firstaid', 'way new health', 'better hardcore'],
  'no-tree-punching': ['no tree punching', 'realistic chopping', 'immersive mining', 'shafted'],
  'crafting-utility': ['jei', 'emi', 'roughly enough items', 'crafting management', 'journeymap', 'xaeros minimap'],
  'performance': ['sodium', 'lithium', 'phosphor', 'starlight', 'embeddium', 'iris'],
  'exploration': ['exploration', 'adventure', 'structures', 'dungeons', 'repurposed structures', 'yungs', 'better dungeon'],
  'realism': ['realistic', 'immersive', 'vanilla plus', 'grounded', 'no tree punching'],
  'temperature': ['temperature', 'thirst', 'exhaustion', 'body temperature', 'tough as nails', 'firstaid'],
  'lighting': ['realistic lighting', 'dynamic lights', 'ambient occlusion', 'shader', 'iris'],
  'creatures': ['birds', 'insects', 'reptiles', 'marine life', 'amphibians', 'naturalist', 'untamed wilds'],
  'danger': ['hostile mobs', 'predators', 'dangerous animals', 'monsters', 'mutant', 'savage', 'cave dweller'],
  'plants': ['plants', 'trees', 'flowers', 'foliage', 'vegetation', 'croptopia', 'farmer delight'],
  'decoration': ['furniture', 'building blocks', 'decoration', 'aesthetic', 'macaws', 'supplementaries'],
  'technology': ['machines', 'automation', 'tech', 'industrial', 'energy', 'power', 'mekanism', 'create'],
  'magic': ['spells', 'enchantment', 'arcane', 'mystical', 'botania', 'ars nouveau', 'iron spells'],
};

// ============================================================
// EXPANDED STAPLE MODS — known high-quality mods
// ============================================================

const STAPLE_MODS = {
  // Biome Generation
  'biomes-o-plenty': { cat: 'biome-generation', tier: 'legendary' },
  'regions-unexplored': { cat: 'biome-generation', tier: 'popular' },
  'terralith': { cat: 'biome-generation', tier: 'legendary' },
  'geophilic': { cat: 'biome-generation', tier: 'popular' },
  'ecologics': { cat: 'biome-generation', tier: 'popular' },
  'wilder-wild': { cat: 'biome-generation', tier: 'popular' },
  'oh-the-biomes-weve-gone': { cat: 'biome-generation', tier: 'popular' },
  'terralith': { cat: 'biome-generation', tier: 'legendary' },
  'regions-unexplored': { cat: 'biome-generation', tier: 'popular' },

  // Mobs & Creatures
  'alexs-mobs': { cat: 'realistic-mobs', tier: 'legendary' },
  'naturalist': { cat: 'realistic-mobs', tier: 'popular' },
  'untamed-wilds': { cat: 'realistic-mobs', tier: 'popular' },
  'creatures-and-beasts': { cat: 'realistic-mobs', tier: 'popular' },
  'friends-and-foes': { cat: 'realistic-mobs', tier: 'popular' },
  'mutant-monsters': { cat: 'danger', tier: 'popular' },
  'mobs-of-mythology': { cat: 'realistic-mobs', tier: 'popular' },
  'cave-dweller': { cat: 'danger', tier: 'popular' },

  // Survival Overhaul
  'tough-as-nails': { cat: 'survival-overhaul', tier: 'legendary' },
  'firstaid': { cat: 'survival-overhaul', tier: 'popular' },
  'way-new-health': { cat: 'survival-overhaul', tier: 'popular' },
  'better-hardcore': { cat: 'difficulty', tier: 'popular' },
  'environmental-hardcore': { cat: 'difficulty', tier: 'niche' },
  'hardcore-revival': { cat: 'difficulty', tier: 'popular' },
  'carrying-cargo': { cat: 'survival-overhaul', tier: 'niche' },
  'farmers-delight': { cat: 'survival-overhaul', tier: 'legendary' },
  'croptopia': { cat: 'survival-overhaul', tier: 'popular' },
  'cookielicious': { cat: 'survival-overhaul', tier: 'niche' },

  // Audio
  'ambient-sounds': { cat: 'immersive-audio', tier: 'legendary' },
  'sound-physics-remastered': { cat: 'immersive-audio', tier: 'legendary' },
  'serene-sounds': { cat: 'immersive-audio', tier: 'popular' },
  'echo-particles': { cat: 'immersive-audio', tier: 'niche' },

  // Weather & Seasons
  'serene-seasons': { cat: 'weather-effects', tier: 'legendary' },
  'weather-storms-tornadoes': { cat: 'weather-effects', tier: 'popular' },
  'better-weather': { cat: 'weather-effects', tier: 'popular' },

  // Realism
  'no-tree-punching': { cat: 'realism', tier: 'legendary' },
  'shafted': { cat: 'realism', tier: 'niche' },

  // Crafting & Utility
  'jei': { cat: 'crafting-utility', tier: 'legendary' },
  'emi': { cat: 'crafting-utility', tier: 'legendary' },
  'roughly-enough-items': { cat: 'crafting-utility', tier: 'popular' },
  'journeymap': { cat: 'crafting-utility', tier: 'legendary' },
  'xaeros-minimap': { cat: 'crafting-utility', tier: 'popular' },
  'xaeros-world-map': { cat: 'crafting-utility', tier: 'popular' },
  'inventory-hud': { cat: 'crafting-utility', tier: 'popular' },
  'appleskin': { cat: 'crafting-utility', tier: 'popular' },
  'jei': { cat: 'crafting-utility', tier: 'legendary' },
  'jade': { cat: 'crafting-utility', tier: 'popular' },
  'wthit': { cat: 'crafting-utility', tier: 'popular' },

  // Performance
  'sodium': { cat: 'performance', tier: 'legendary' },
  'lithium': { cat: 'performance', tier: 'legendary' },
  'phosphor': { cat: 'performance', tier: 'popular' },
  'starlight': { cat: 'performance', tier: 'popular' },
  'embeddium': { cat: 'performance', tier: 'popular' },
  'iris': { cat: 'performance', tier: 'legendary' },

  // Tech
  'create': { cat: 'technology', tier: 'legendary' },
  'mekanism': { cat: 'technology', tier: 'legendary' },
  'immersive-engineering': { cat: 'technology', tier: 'legendary' },
  'applied-energistics-2': { cat: 'technology', tier: 'legendary' },
  'refined-storage': { cat: 'technology', tier: 'legendary' },
  'thermal-expansion': { cat: 'technology', tier: 'popular' },
  'power-stones': { cat: 'technology', tier: 'niche' },

  // Magic
  'botania': { cat: 'magic', tier: 'legendary' },
  'ars-nouveau': { cat: 'magic', tier: 'legendary' },
  'iron-spells': { cat: 'magic', tier: 'popular' },
  'blood-magic': { cat: 'magic', tier: 'popular' },
  'thaumcraft': { cat: 'magic', tier: 'legendary' },

  // Decoration & Building
  'macaws-bridges': { cat: 'decoration', tier: 'legendary' },
  'macaws-roofs': { cat: 'decoration', tier: 'popular' },
  'macaws-furniture': { cat: 'decoration', tier: 'popular' },
  'supplementaries': { cat: 'decoration', tier: 'popular' },
  'chisel': { cat: 'decoration', tier: 'legendary' },

  // Exploration
  'repurposed-structures-fabric': { cat: 'exploration', tier: 'popular' },
  'yungs-cave-biomes': { cat: 'exploration', tier: 'popular' },
  'better-archeology': { cat: 'exploration', tier: 'popular' },
  'dungeons-and-taverns': { cat: 'exploration', tier: 'popular' },
  'atm-sstructures-fabricforge': { cat: 'exploration', tier: 'popular' },
};

const TIER_SCORES = { legendary: 80, popular: 50, niche: 25 };

// ============================================================
// CONFLICT GROUPS
// ============================================================

export const CONFLICT_GROUPS = [
  { name: 'Recipe Viewer', mods: ['jei', 'emi', 'roughly-enough-items', 'jade'], description: 'These all show item recipes. Pick one.' },
  { name: 'Performance', mods: ['sodium', 'embeddium'], description: 'Both replace the renderer. Only use one.' },
  { name: 'Lighting Engine', mods: ['lithium', 'starlight', 'phosphor'], description: 'These optimize the lighting engine. Pick one.' },
  { name: 'Minimap', mods: ['xaeros-minimap', 'journeymap', 'blue-map', 'ftb-chunks-map'], description: 'Multiple map mods overlap your screen.' },
  { name: 'Seasons', mods: ['serene-seasons', 'fabric-seasons'], description: 'Both add seasonal cycles. Only one.' },
  { name: 'Health Overhaul', mods: ['firstaid', 'way-new-health', 'tough-as-nails'], description: 'These modify health/difficulty. Combining breaks balance.' },
  { name: 'Sound Overhaul', mods: ['ambient-sounds', 'serene-sounds', 'sound-physics-remastered'], description: 'Multiple sound mods can conflict.' },
];

// ============================================================
// EXPAND SYNONYMS — takes user terms, expands to related words
// ============================================================

function expandTerms(terms) {
  const expanded = new Set(terms.map(t => t.toLowerCase()));
  for (const term of terms) {
    const lower = term.toLowerCase();
    // Direct synonyms
    if (SYNONYM_MAP[lower]) {
      for (const syn of SYNONYM_MAP[lower]) expanded.add(syn.toLowerCase());
    }
    // Partial matches — if "jungle" is in synonyms map, expand
    for (const [key, values] of Object.entries(SYNONYM_MAP)) {
      if (lower.includes(key) || key.includes(lower)) {
        expanded.add(key);
        for (const v of values) expanded.add(v.toLowerCase());
      }
    }
  }
  return Array.from(expanded);
}

// ============================================================
// FUZZY MATCH SCORE — how well a term matches text
// Returns 0-1, using multiple matching strategies
// ============================================================

function fuzzyMatchScore(term, text) {
  if (!term || !text) return 0;
  const t = term.toLowerCase();
  const tx = text.toLowerCase();

  // Exact substring match (highest signal)
  if (tx.includes(t)) return 1.0;

  // Word-boundary match (e.g., "sound" in "sound physics")
  const words = tx.split(/[\s\-_,.]+/);
  if (words.includes(t)) return 0.95;

  // Partial word match (e.g., "forest" in "forests")
  for (const word of words) {
    if (word.length >= 4 && (word.startsWith(t) || t.startsWith(word))) return 0.8;
    if (t.length >= 4 && (t.startsWith(word) || word.startsWith(t))) return 0.7;
  }

  // Levenshtein-based similarity for typos (only for short terms)
  if (t.length >= 4) {
    for (const word of words) {
      if (Math.abs(word.length - t.length) <= 2) {
        const sim = 1 - (levenshtein(t, word) / Math.max(t.length, word.length));
        if (sim >= 0.75) return sim * 0.7;
      }
    }
  }

  return 0;
}

function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] !== b[j - 1] ? 1 : 0)
      );
    }
  }
  return dp[m][n];
}

// ============================================================
// DETECT CONFLICTS
// ============================================================

export function detectConflicts(selectedSlugs) {
  const conflicts = [];
  const selectedSet = new Set(selectedSlugs.map(s => s.toLowerCase()));
  for (const group of CONFLICT_GROUPS) {
    const matched = group.mods.filter(m => selectedSet.has(m));
    if (matched.length > 1) {
      conflicts.push({ groupName: group.name, mods: matched, description: group.description });
    }
  }
  return conflicts;
}

// ============================================================
// MAIN ENTRY POINT
// ============================================================

export async function findModsForUser(userMessage, chatHistory = [], options = {}) {
  const { minecraftVersion, loader } = options;

  const analysis = await extractKeywords(userMessage, chatHistory);

  const searchOptions = {};
  if (minecraftVersion) searchOptions.minecraftVersion = minecraftVersion;
  if (loader) searchOptions.loaders = [loader];

  // Build search queries with category boosts
  let allQueries = [];
  const aiQueries = (analysis.searchQueries || []).filter(q => {
    const words = q.split(' ').length;
    return words >= 1 && words <= 4 && q.length > 2;
  });
  allQueries.push(...aiQueries);

  const categories = analysis.modCategories || [];
  for (const cat of categories) {
    const boostQueries = CATEGORY_SEARCH_BOOSTS[cat] || [];
    allQueries.push(...boostQueries.slice(0, 4));
  }

  const keywords = (analysis.keywords || []).filter(k => k.split(' ').length <= 3);
  allQueries.push(...keywords.slice(0, 6));
  allQueries = [...new Set(allQueries.map(q => q.toLowerCase().trim()))];

  const rawMods = await multiSearch(allQueries, { ...searchOptions, limit: 15 });

  // Score with the new algorithm
  const scoredMods = scoreModsV2(rawMods, analysis, allQueries);

  // Smart diverse selection
  const topMods = selectDiverseModsV2(scoredMods, 30);

  const explainedMods = topMods.map(mod => ({
    ...mod,
    whySuggested: generateLocalExplanation(mod, analysis),
  }));

  const modIds = explainedMods.map(m => m.id);

  // Fetch galleries and dependencies in parallel
  const top8Ids = modIds.slice(0, 10);
  const [galleryResults, dependencies] = await Promise.all([
    Promise.allSettled(
      top8Ids.map(async (id) => {
        try {
          const details = await getModDetails(id);
          return { id, gallery: (details.gallery || []).slice(0, 4).map(img => ({
            url: img.raw_url || img.url, title: img.title || '', description: img.description || '',
          }))};
        } catch { return { id, gallery: [] }; }
      })
    ),
    getBulkDependencies(modIds, minecraftVersion || '1.20.1', loader || 'fabric'),
  ]);

  const galleryMap = new Map();
  for (const r of galleryResults) { if (r.status === 'fulfilled') galleryMap.set(r.value.id, r.value.gallery); }
  for (const mod of explainedMods) mod.gallery = galleryMap.get(mod.id) || [];

  const mainModIds = new Set(explainedMods.map(m => m.id));
  const filteredDeps = dependencies.filter(dep => !mainModIds.has(dep.projectId));

  return { mods: explainedMods, analysis, dependencies: filteredDeps };
}

// ============================================================
// SCORING V2 — Multi-signal, weighted scoring
// ============================================================

export function scoreModsV2(mods, analysis, searchQueries = []) {
  const { themes = [], keywords = [], modCategories = [] } = analysis;
  const userCats = modCategories.map(c => c.toLowerCase());

  // Expand user terms with synonyms
  const rawTerms = [...themes, ...keywords].map(t => t.toLowerCase());
  const expandedTerms = expandTerms(rawTerms);
  const moodTerms = (analysis.mood || '').toLowerCase().split(/[,.\s]+/).filter(t => t.length > 2);

  // Deduplicate by slug
  const seenSlugs = new Set();
  const uniqueMods = mods.filter(mod => {
    const slug = (mod.slug || '').toLowerCase();
    if (seenSlugs.has(slug)) return false;
    seenSlugs.add(slug);
    return true;
  });

  // Calculate query frequency — how many search queries mention this mod's slug/title
  const queryFrequency = new Map();
  for (const mod of uniqueMods) {
    const slug = (mod.slug || '').toLowerCase();
    const title = (mod.title || '').toLowerCase();
    let count = 0;
    for (const q of searchQueries) {
      const ql = q.toLowerCase();
      if (ql.includes(slug) || slug.includes(ql.replace(/\s+/g, '-')) || title.includes(ql)) {
        count++;
      }
    }
    queryFrequency.set(mod.project_id, count);
  }

  // Score each mod
  return uniqueMods.map(mod => {
    let score = 20; // base
    const title = (mod.title || '').toLowerCase();
    const slug = (mod.slug || '').toLowerCase();
    const desc = (mod.description || '').toLowerCase();
    const combined = `${title} ${slug} ${desc}`;
    const modCats = (mod.categories || []).map(c => c.toLowerCase());

    // ---- SIGNAL 1: Staple mod bonus (max ~35 pts) ----
    const staple = STAPLE_MODS[slug];
    if (staple) {
      score += TIER_SCORES[staple.tier] || 25;
      if (userCats.includes(staple.cat)) score += 20;
    } else {
      // Penalize unknown mods less aggressively — let other signals decide
      score -= 5;
    }

    // ---- SIGNAL 2: Download popularity with category normalization (max ~25 pts) ----
    const avgDl = getAvgDownloadsForCategory(modCats);
    const popularityRatio = mod.downloads / Math.max(avgDl, 1);
    const popScore = Math.min(25, Math.round(Math.log2(popularityRatio + 1) * 8));
    score += popScore;

    // ---- SIGNAL 3: Semantic relevance — expanded terms (max ~30 pts) ----
    let semanticHits = 0;
    let maxTermScore = 0;
    for (const term of expandedTerms) {
      if (term.length < 3) continue;
      const match = fuzzyMatchScore(term, combined);
      if (match > 0) {
        semanticHits++;
        maxTermScore = Math.max(maxTermScore, match);
        score += Math.round(match * 8);
      }
    }
    // Bonus for matching multiple terms (completeness signal)
    if (semanticHits >= 3) score += 8;
    else if (semanticHits >= 2) score += 4;

    // ---- SIGNAL 4: Mood/atmosphere terms (max ~10 pts) ----
    for (const term of moodTerms) {
      if (fuzzyMatchScore(term, combined) > 0) score += 3;
    }

    // ---- SIGNAL 5: Category alignment (max ~15 pts) ----
    for (const modCat of modCats) {
      const mapped = CATEGORY_TAXONOMY[modCat] || [];
      for (const userCat of userCats) {
        if (mapped.includes(userCat)) score += 6;
        if (modCat === userCat) score += 3;
      }
    }

    // ---- SIGNAL 6: Query frequency — how often this mod appears in queries (max ~10 pts) ----
    const freq = queryFrequency.get(mod.project_id) || 0;
    score += Math.min(10, freq * 3);

    // ---- SIGNAL 7: Recency (max ~10 pts, can penalize up to -15) ----
    if (mod.date_modified) {
      const days = (Date.now() - new Date(mod.date_modified).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 30) score += 10;
      else if (days < 90) score += 7;
      else if (days < 180) score += 4;
      else if (days < 365) score += 1;
      else if (days > 730) score -= 12;
      else if (days > 365) score -= 6;
    }

    // ---- SIGNAL 8: Community engagement (max ~5 pts) ----
    if (mod.follows > 10000) score += 5;
    else if (mod.follows > 5000) score += 3;
    else if (mod.follows > 1000) score += 1;

    // ---- PENALTIES ----
    // Library/API penalty
    if (modCats.includes('library')) score -= 20;
    if (title.includes('api') && !title.includes('minecraft')) score -= 12;
    if (desc.startsWith('a library') || desc.startsWith('an api')) score -= 12;

    // Server-only penalty (client can't use it)
    if (mod.client_side === 'unsupported' && mod.server_side === 'required') score -= 10;

    // Very low relevance — no semantic hits at all
    if (semanticHits === 0 && maxTermScore === 0) score -= 15;

    score = Math.min(99, Math.max(5, score));

    return {
      id: mod.project_id, slug: mod.slug, title: mod.title, description: mod.description,
      icon_url: getModIconUrl(mod.project_id, mod.icon_url), downloads: mod.downloads, follows: mod.follows,
      categories: mod.categories || [], client_side: mod.client_side, server_side: mod.server_side,
      date_created: mod.date_created, date_modified: mod.date_modified, versions: mod.versions || [],
      source_url: mod.source_url, project_url: `https://modrinth.com/mod/${mod.slug}`,
      matchScore: score, whySuggested: '', selectedByUser: false,
      isStaple: !!staple, stapleTier: staple?.tier || null, gallery: [],
      _semanticHits: semanticHits, // internal — used for diversity
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function getAvgDownloadsForCategory(modCats) {
  for (const cat of modCats) {
    const mapped = CATEGORY_TAXONOMY[cat] || [];
    for (const m of mapped) {
      if (CATEGORY_AVG_DOWNLOADS[m]) return CATEGORY_AVG_DOWNLOADS[m];
    }
    if (CATEGORY_AVG_DOWNLOADS[cat]) return CATEGORY_AVG_DOWNLOADS[cat];
  }
  return 2_000_000; // global average
}

// ============================================================
// DIVERSE SELECTION V2 — smarter category detection + caps
// ============================================================

export function selectDiverseModsV2(sortedMods, maxMods) {
  const CATEGORY_LIMITS = {
    'biome-generation': 5,
    'realistic-mobs': 5,
    'survival-overhaul': 4,
    'weather-effects': 3,
    'immersive-audio': 3,
    'difficulty': 3,
    'realism': 2,
    'crafting-utility': 2,
    'exploration': 3,
    'danger': 3,
    'technology': 3,
    'magic': 3,
    'decoration': 3,
    'temperature': 2,
    'lighting': 1,
    'creatures': 2,
    'no-tree-punching': 1,
    'plants': 2,
    'performance': 0,
  };

  const selected = [];
  const categoryCounts = {};

  // Pass 1: fill categories respecting limits
  for (const mod of sortedMods) {
    if (selected.length >= maxMods) break;

    const modCats = (mod.categories || []).map(c => c.toLowerCase());
    let assignedCat = assignCategory(modCats);
    const limit = CATEGORY_LIMITS[assignedCat] ?? 3;
    const count = categoryCounts[assignedCat] || 0;

    if (count < limit) {
      selected.push(mod);
      categoryCounts[assignedCat] = count + 1;
    }
  }

  // Pass 2: fill remaining slots with highest-scored unselected mods
  if (selected.length < maxMods) {
    const selectedIds = new Set(selected.map(m => m.id));
    for (const mod of sortedMods) {
      if (selected.length >= maxMods) break;
      if (!selectedIds.has(mod.id)) {
        selected.push(mod);
        selectedIds.add(mod.id);
      }
    }
  }

  return selected;
}

function assignCategory(modCats) {
  for (const cat of modCats) {
    const mapped = CATEGORY_TAXONOMY[cat];
    if (mapped && mapped.length > 0) return mapped[0];
    if (CATEGORY_AVG_DOWNLOADS[cat]) return cat;
  }
  return 'other';
}

// ============================================================
// EXPLANATION GENERATOR — improved with semantic matching
// ============================================================

function generateLocalExplanation(mod, analysis) {
  const { themes = [], keywords = [] } = analysis;
  const desc = (mod.description || '').toLowerCase();
  const title = (mod.title || '').toLowerCase();
  const combined = `${title} ${desc}`;
  const modCats = (mod.categories || []).map(c => c.toLowerCase());

  // Find which terms this mod matches
  const rawTerms = [...themes, ...keywords];
  const expanded = expandTerms(rawTerms);
  const matchedTerms = expanded.filter(t => t.length > 2 && fuzzyMatchScore(t, combined) > 0.5);

  // Pick the most specific matched term (prefer exact over fuzzy)
  const bestTerm = matchedTerms[0] || rawTerms[0] || 'your gameplay';

  let verb = 'enhances your game with';
  if (modCats.some(c => c.includes('world') || c.includes('generation'))) verb = 'transforms the world with';
  else if (modCats.some(c => c.includes('mobs'))) verb = 'brings realistic creatures with';
  else if (modCats.some(c => c.includes('magic'))) verb = 'adds magical elements with';
  else if (modCats.some(c => c.includes('technology'))) verb = 'adds technology with';
  else if (modCats.some(c => c.includes('adventure'))) verb = 'enhances adventure with';
  else if (modCats.some(c => c.includes('optimization') || c.includes('performance'))) verb = 'improves performance with';
  else if (modCats.some(c => c.includes('utility'))) verb = 'adds quality-of-life with';
  else if (modCats.some(c => c.includes('difficulty'))) verb = 'increases challenge with';
  else if (modCats.some(c => c.includes('decoration'))) verb = 'beautifies your world with';
  else if (modCats.some(c => c.includes('equipment') || c.includes('armor'))) verb = 'equips you with';
  else if (modCats.some(c => c.includes('food'))) verb = 'enriches survival with';

  if (matchedTerms.length > 0) {
    return `${verb} ${bestTerm} — ${mod.description?.slice(0, 60) || 'enhances gameplay'}`;
  }
  if (mod.description) return `${verb} ${mod.description.slice(0, 75)}`;
  return 'Adds to your gameplay experience';
}

// ============================================================
// LEGACY EXPORTS (keep old function names for backward compat)
// ============================================================

export function selectDiverseMods(sortedMods, maxMods) {
  return selectDiverseModsV2(sortedMods, maxMods);
}

export function scoreModsIntelligently(mods, analysis) {
  return scoreModsV2(mods, analysis, []);
}
