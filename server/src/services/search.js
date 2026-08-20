import { extractKeywords } from './ai.js';
import { multiSearch, searchMods, getModIconUrl, getBulkDependencies, getModDetails } from './modrinth.js';

const CATEGORY_SEARCH_BOOSTS = {
  'survival-overhaul': ['tough as nails', 'firstaid', 'realistic survival', 'survival difficulty'],
  'realistic-mobs': ['alexs mobs', 'naturalist', 'untamed wilds', 'realistic animals', 'ecologics', 'wilder wild', 'creatures'],
  'biome-generation': ['biomes o plenty', 'regions unexplored', 'terralith', 'biome worldgen'],
  'weather-effects': ['weather storms tornadoes', 'serene seasons', 'seasons weather', 'realistic weather'],
  'immersive-audio': ['ambient sounds', 'sound physics remastered', 'serene sounds', 'realistic sounds', 'wilder wild'],
  'difficulty': ['hardcore mode', 'permadeath', 'realistic damage', 'health overhaul', 'firstaid', 'way new health'],
  'no-tree-punching': ['no tree punching', 'realistic chopping', 'immersive mining'],
  'crafting-utility': ['jei', 'emi', 'roughly enough items', 'crafting management'],
  'performance': ['sodium', 'lithium', 'phosphor', 'performance optimization'],
  'exploration': ['exploration', 'adventure', 'structures', 'dungeons'],
  'realism': ['realistic', 'immersive', 'vanilla plus', 'grounded'],
  'temperature': ['temperature', 'thirst', 'exhaustion', 'body temperature'],
  'lighting': ['realistic lighting', 'dynamic lights', 'ambient occlusion'],
  'creatures': ['birds', 'insects', 'reptiles', 'marine life', 'amphibians'],
  'danger': ['hostile mobs', 'predators', 'dangerous animals', 'monsters'],
  'plants': ['plants', 'trees', 'flowers', 'foliage', 'vegetation'],
};

const STAPLE_MODS = {
  'biomes-o-plenty': { cat: 'biome-generation', tier: 'legendary' },
  'regions-unexplored': { cat: 'biome-generation', tier: 'popular' },
  'terralith': { cat: 'biome-generation', tier: 'legendary' },
  'geophilic': { cat: 'biome-generation', tier: 'popular' },
  'ecologics': { cat: 'biome-generation', tier: 'popular' },
  'wilder-wild': { cat: 'biome-generation', tier: 'popular' },
  'alexs-mobs': { cat: 'realistic-mobs', tier: 'legendary' },
  'naturalist': { cat: 'realistic-mobs', tier: 'popular' },
  'untamed-wilds': { cat: 'realistic-mobs', tier: 'popular' },
  'creatures-and-beasts': { cat: 'realistic-mobs', tier: 'popular' },
  'friends-and-foes': { cat: 'realistic-mobs', tier: 'popular' },
  'mutant-monsters': { cat: 'danger', tier: 'popular' },
  'tough-as-nails': { cat: 'survival-overhaul', tier: 'legendary' },
  'firstaid': { cat: 'survival-overhaul', tier: 'popular' },
  'way-new-health': { cat: 'survival-overhaul', tier: 'popular' },
  'better-hardcore': { cat: 'difficulty', tier: 'popular' },
  'environmental-hardcore': { cat: 'difficulty', tier: 'niche' },
  'hardcore-revival': { cat: 'difficulty', tier: 'popular' },
  'carrying-cargo': { cat: 'survival-overhaul', tier: 'niche' },
  'ambient-sounds': { cat: 'immersive-audio', tier: 'legendary' },
  'sound-physics-remastered': { cat: 'immersive-audio', tier: 'legendary' },
  'serene-sounds': { cat: 'immersive-audio', tier: 'popular' },
  'serene-seasons': { cat: 'weather-effects', tier: 'legendary' },
  'weather-storms-tornadoes': { cat: 'weather-effects', tier: 'popular' },
  'better-weather': { cat: 'weather-effects', tier: 'popular' },
  'no-tree-punching': { cat: 'realism', tier: 'legendary' },
  'realistic-horse-editor': { cat: 'realism', tier: 'niche' },
  'realistic-bee-keeping': { cat: 'realism', tier: 'niche' },
  'jei': { cat: 'crafting-utility', tier: 'legendary' },
  'emi': { cat: 'crafting-utility', tier: 'legendary' },
  'roughly-enough-items': { cat: 'crafting-utility', tier: 'popular' },
  'journeymap': { cat: 'crafting-utility', tier: 'legendary' },
  'xaeros-minimap': { cat: 'crafting-utility', tier: 'popular' },
  'inventory-hud': { cat: 'crafting-utility', tier: 'popular' },
  'appleskin': { cat: 'crafting-utility', tier: 'popular' },
  'sodium': { cat: 'performance', tier: 'legendary' },
  'lithium': { cat: 'performance', tier: 'legendary' },
  'phosphor': { cat: 'performance', tier: 'popular' },
  'starlight': { cat: 'performance', tier: 'popular' },
  'kubejs': { cat: 'crafting-utility', tier: 'popular' },
  'crafttweaker': { cat: 'crafting-utility', tier: 'popular' },
};

const TIER_SCORES = { legendary: 80, popular: 50, niche: 25 };

export const CONFLICT_GROUPS = [
  { name: 'Recipe Viewer', mods: ['jei', 'emi', 'roughly-enough-items', 'jade'], description: 'These all show item recipes. Pick one.' },
  { name: 'Performance', mods: ['sodium', 'embeddium'], description: 'Both replace the renderer. Only use one.' },
  { name: 'Lighting Engine', mods: ['lithium', 'starlight', 'phosphor'], description: 'These optimize the lighting engine. Pick one.' },
  { name: 'Minimap', mods: ['xaeros-minimap', 'journeymap', 'blue-map', 'ftb-chunks-map'], description: 'Multiple map mods overlap your screen.' },
  { name: 'Seasons', mods: ['serene-seasons', 'fabric-seasons'], description: 'Both add seasonal cycles. Only one.' },
  { name: 'Health Overhaul', mods: ['firstaid', 'way-new-health', 'tough-as-nails'], description: 'These modify health/difficulty. Combining breaks balance.' },
  { name: 'Sound Overhaul', mods: ['ambient-sounds', 'serene-sounds', 'sound-physics-remastered'], description: 'Multiple sound mods can conflict.' },
];

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

export async function findModsForUser(userMessage, chatHistory = [], options = {}) {
  const { minecraftVersion, loader } = options;

  const analysis = await extractKeywords(userMessage, chatHistory);

  const searchOptions = {};
  if (minecraftVersion) searchOptions.minecraftVersion = minecraftVersion;
  if (loader) searchOptions.loaders = [loader];

  let allQueries = [];
  const aiQueries = (analysis.searchQueries || []).filter(q => {
    const words = q.split(' ').length;
    return words >= 1 && words <= 4 && q.length > 2;
  });
  allQueries.push(...aiQueries);

  const categories = analysis.modCategories || [];
  for (const cat of categories) {
    const boostQueries = CATEGORY_SEARCH_BOOSTS[cat] || [];
    allQueries.push(...boostQueries.slice(0, 3));
  }

  const keywords = (analysis.keywords || []).filter(k => k.split(' ').length <= 3);
  allQueries.push(...keywords.slice(0, 5));
  allQueries = [...new Set(allQueries.map(q => q.toLowerCase().trim()))];

  const rawMods = await multiSearch(allQueries, { ...searchOptions, limit: 12 });
  const scoredMods = scoreModsIntelligently(rawMods, analysis);

  // Diverse selection: pick top mod per category, then fill remaining by score
  const topMods = selectDiverseMods(scoredMods, 30);
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

  // Deduplicate: remove dependencies that are already in the main mod list
  const mainModIds = new Set(explainedMods.map(m => m.id));
  const filteredDeps = dependencies.filter(dep => !mainModIds.has(dep.projectId));

  return { mods: explainedMods, analysis, dependencies: filteredDeps };
}

function selectDiverseMods(sortedMods, maxMods) {
  const CATEGORY_LIMITS = {
    'biome-generation': 4,
    'realistic-mobs': 4,
    'survival-overhaul': 3,
    'weather-effects': 2,
    'immersive-audio': 2,
    'difficulty': 2,
    'realism': 2,
    'crafting-utility': 2,
    'exploration': 2,
    'danger': 2,
    'performance': 0,
    'technology': 2,
    'magic': 2,
    'decoration': 2,
    'temperature': 1,
    'lighting': 1,
    'creatures': 2,
    'no-tree-punching': 1,
    'plants': 2,
  };

  const selected = [];
  const categoryCounts = {};

  for (const mod of sortedMods) {
    if (selected.length >= maxMods) break;

    // Find best category match for this mod
    const modCats = (mod.categories || []).map(c => c.toLowerCase());
    let assignedCat = 'other';
    for (const cat of modCats) {
      const mapped = {
        'worldgen': 'biome-generation', 'world-generation': 'biome-generation',
        'mobs': 'realistic-mobs', 'adventure': 'exploration',
        'utility': 'crafting-utility', 'optimization': 'performance',
        'food': 'survival-overhaul', 'armor': 'survival-overhaul',
        'equipment': 'survival-overhaul', 'weapons': 'danger',
      };
      const canonical = mapped[cat] || cat;
      if (CATEGORY_LIMITS[canonical]) { assignedCat = canonical; break; }
    }

    const limit = CATEGORY_LIMITS[assignedCat] ?? 3;
    const count = categoryCounts[assignedCat] || 0;
    if (count < limit) {
      selected.push(mod);
      categoryCounts[assignedCat] = count + 1;
    }
  }

  // If under max, fill with remaining high-scoring mods from any category
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

function scoreModsIntelligently(mods, analysis) {
  const { themes = [], keywords = [], modCategories = [] } = analysis;
  const allTerms = [...themes, ...keywords].map(t => t.toLowerCase());
  const moodTerms = (analysis.mood || '').toLowerCase().split(/[,\\s]+/).filter(t => t.length > 2);
  const userCats = modCategories.map(c => c.toLowerCase());

  // Deduplicate by slug - keep only the first occurrence
  const seenSlugs = new Set();
  const uniqueMods = mods.filter(mod => {
    const slug = (mod.slug || '').toLowerCase();
    if (seenSlugs.has(slug)) return false;
    seenSlugs.add(slug);
    return true;
  });

  return uniqueMods.map(mod => {
    let score = 30;
    const title = (mod.title || '').toLowerCase();
    const slug = (mod.slug || '').toLowerCase();
    const desc = (mod.description || '').toLowerCase();
    const combined = `${title} ${slug} ${desc}`;
    const modCats = (mod.categories || []).map(c => c.toLowerCase());

    const staple = STAPLE_MODS[slug];
    if (staple) { score += TIER_SCORES[staple.tier] || 30; if (userCats.includes(staple.cat)) score += 25; }
    else { score -= 10; }

    if (mod.downloads > 10_000_000) score += 35;
    else if (mod.downloads > 5_000_000) score += 28;
    else if (mod.downloads > 1_000_000) score += 22;
    else if (mod.downloads > 500_000) score += 15;
    else if (mod.downloads > 100_000) score += 8;
    else if (mod.downloads > 10_000) score += 3;
    else score -= 15;

    for (const term of allTerms) {
      if (term.length < 3) continue;
      if (combined.includes(term)) score += 6;
      const words = term.split(' ');
      if (words.length > 1 && words.some(w => w.length > 3 && combined.includes(w))) score += 2;
    }
    for (const term of moodTerms) { if (combined.includes(term)) score += 3; }

    const categoryMap = {
      'worldgen': ['biome-generation', 'exploration'], 'world-generation': ['biome-generation', 'exploration'],
      'mobs': ['realistic-mobs', 'danger'], 'adventure': ['exploration', 'danger'],
      'utility': ['crafting-utility'], 'optimization': ['performance'], 'performance': ['performance'],
      'food': ['survival-overhaul'], 'difficulty': ['survival-overhaul', 'difficulty'],
      'decoration': ['biome-generation'], 'storage': ['crafting-utility'],
      'equipment': ['survival-overhaul'], 'armor': ['survival-overhaul'],
      'weapons': ['danger'], 'cursed': ['danger'], 'qol': ['crafting-utility'],
    };
    for (const modCat of modCats) {
      for (const userCat of userCats) {
        const mapped = categoryMap[modCat] || [];
        if (mapped.includes(userCat)) score += 6;
        if (modCat === userCat) score += 3;
      }
    }

    if (mod.date_modified) {
      const days = (Date.now() - new Date(mod.date_modified).getTime()) / (1000 * 60 * 60 * 24);
      if (days < 30) score += 8; else if (days < 90) score += 5; else if (days < 180) score += 2;
      else if (days > 365) score -= 8; else if (days > 730) score -= 15;
    }

    if (mod.follows > 10000) score += 5; else if (mod.follows > 5000) score += 3; else if (mod.follows > 1000) score += 1;

    if (modCats.includes('library')) score -= 20;
    if (title.includes('api') && !title.includes('minecraft')) score -= 15;
    if (desc.startsWith('a library') || desc.startsWith('an api')) score -= 15;
    if (mod.client_side === 'unsupported' && mod.server_side === 'required') score -= 15;

    score = Math.min(99, Math.max(5, score));

    return {
      id: mod.project_id, slug: mod.slug, title: mod.title, description: mod.description,
      icon_url: getModIconUrl(mod.project_id, mod.icon_url), downloads: mod.downloads, follows: mod.follows,
      categories: mod.categories || [], client_side: mod.client_side, server_side: mod.server_side,
      date_created: mod.date_created, date_modified: mod.date_modified, versions: mod.versions || [],
      source_url: mod.source_url, project_url: `https://modrinth.com/mod/${mod.slug}`,
      matchScore: score, whySuggested: '', selectedByUser: false,
      isStaple: !!staple, stapleTier: staple?.tier || null, gallery: [],
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

function generateLocalExplanation(mod, analysis) {
  const { themes = [], keywords = [] } = analysis;
  const desc = (mod.description || '').toLowerCase();
  const title = (mod.title || '').toLowerCase();
  const combined = `${title} ${desc}`;
  const modCats = (mod.categories || []).map(c => c.toLowerCase());

  const allTerms = [...themes, ...keywords];
  const matchedTerms = allTerms.filter(t => t.length > 2 && combined.includes(t.toLowerCase()));

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

  if (matchedTerms.length > 0) return `${verb} ${matchedTerms[0]} — ${mod.description?.slice(0, 55) || 'enhances gameplay'}`;
  if (mod.description) return `${verb} ${mod.description.slice(0, 75)}`;
  return 'Adds to your gameplay experience';
}
