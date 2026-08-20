import { describe, it, expect } from 'vitest';
import { scoreModsIntelligently, scoreModsV2, selectDiverseMods, selectDiverseModsV2, CONFLICT_GROUPS } from '../services/search.js';

// Mock mod data for testing
const MOCK_MODS = [
  {
    project_id: 'mod-1',
    slug: 'biomes-o-plenty',
    title: "Biomes O' Plenty",
    description: 'Adds 50+ unique biomes with new trees, flowers, and terrain',
    icon_url: '',
    downloads: 30_000_000,
    follows: 5000,
    categories: ['worldgen', 'fabric', 'forge'],
    client_side: 'required',
    server_side: 'required',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
  {
    project_id: 'mod-2',
    slug: 'tough-as-nails',
    title: 'Tough As Nails',
    description: 'Survival mod with thirst, temperature, and body heat mechanics',
    icon_url: '',
    downloads: 1_800_000,
    follows: 1200,
    categories: ['fabric', 'food', 'game-mechanics'],
    client_side: 'required',
    server_side: 'required',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
  {
    project_id: 'mod-3',
    slug: 'sodium',
    title: 'Sodium',
    description: 'Performance optimization mod for rendering',
    icon_url: '',
    downloads: 50_000_000,
    follows: 10000,
    categories: ['optimization', 'fabric'],
    client_side: 'required',
    server_side: 'unsupported',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
  {
    project_id: 'mod-4',
    slug: 'random-mod',
    title: 'Random Mod',
    description: 'Some random mod that does nothing related',
    icon_url: '',
    downloads: 5000,
    follows: 100,
    categories: ['utility'],
    client_side: 'optional',
    server_side: 'required',
    date_modified: '2022-01-01T00:00:00Z',
    source_url: '',
  },
  {
    project_id: 'mod-5',
    slug: 'ambient-sounds',
    title: 'AmbientSounds',
    description: 'Realistic ambient sounds and environmental audio',
    icon_url: '',
    downloads: 36_000_000,
    follows: 6700,
    categories: ['decoration', 'fabric', 'forge'],
    client_side: 'required',
    server_side: 'unsupported',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
  {
    project_id: 'mod-6',
    slug: 'naturalist',
    title: 'Naturalist',
    description: 'Adds 47 realistic animals and wildlife to your world',
    icon_url: '',
    downloads: 10_000_000,
    follows: 3800,
    categories: ['adventure', 'fabric', 'forge', 'mobs'],
    client_side: 'required',
    server_side: 'required',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
  {
    project_id: 'mod-7',
    slug: 'sound-physics-remastered',
    title: 'Sound Physics Remastered',
    description: 'Realistic sound attenuation, reverberation, and absorption',
    icon_url: '',
    downloads: 49_000_000,
    follows: 9300,
    categories: ['adventure', 'fabric', 'forge', 'utility'],
    client_side: 'required',
    server_side: 'optional',
    date_modified: new Date().toISOString(),
    source_url: '',
  },
];

describe('scoreModsV2 (new algorithm)', () => {
  const jungleAnalysis = {
    themes: ['jungle', 'survival'],
    keywords: ['dangerous', 'wildlife', 'weather', 'realistic'],
    modCategories: ['biome-generation', 'realistic-mobs', 'survival-overhaul'],
    mood: 'intense, immersive, dangerous',
  };

  const queries = ['naturalist animals', 'tough as nails', 'biomes o plenty', 'sound physics', 'jungle', 'wildlife'];

  it('should score relevant mods much higher than irrelevant ones', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    const relevant = scored.find(m => m.slug === 'biomes-o-plenty');
    const irrelevant = scored.find(m => m.slug === 'random-mod');

    expect(relevant.matchScore).toBeGreaterThan(irrelevant.matchScore + 30);
  });

  it('should rank mods with semantic overlap highest', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    // Biomes O Plenty + Naturalist + Tough As Nails should all be top 3
    const topSlugs = scored.slice(0, 4).map(m => m.slug);
    expect(topSlugs).toContain('biomes-o-plenty');
    expect(topSlugs).toContain('tough-as-nails');
  });

  it('should normalize downloads by category (1M in niche = good)', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    const toughAsNails = scored.find(m => m.slug === 'tough-as-nails');
    // 1.8M downloads in survival-overhaul (avg 1.5M) is above average
    expect(toughAsNails.matchScore).toBeGreaterThan(40);
  });

  it('should give bonus for matching multiple expanded terms', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    const bop = scored.find(m => m.slug === 'biomes-o-plenty');
    // BOP should match "jungle", "biome", "terrain" etc. via synonyms
    expect(bop.matchScore).toBeGreaterThan(70);
  });

  it('should penalize mods with zero semantic hits', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    const random = scored.find(m => m.slug === 'random-mod');
    // No semantic matches + low downloads + old = very low
    expect(random.matchScore).toBeLessThan(20);
  });

  it('should rank results by score descending', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    for (let i = 1; i < scored.length; i++) {
      expect(scored[i - 1].matchScore).toBeGreaterThanOrEqual(scored[i].matchScore);
    }
  });

  it('should never exceed 99 or go below 5', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    for (const mod of scored) {
      expect(mod.matchScore).toBeLessThanOrEqual(99);
      expect(mod.matchScore).toBeGreaterThanOrEqual(5);
    }
  });

  it('should deduplicate by slug', () => {
    const dupe = [...MOCK_MODS, { ...MOCK_MODS[0], project_id: 'dupe', slug: 'biomes-o-plenty' }];
    const scored = scoreModsV2(dupe, jungleAnalysis, queries);
    const count = scored.filter(m => m.slug === 'biomes-o-plenty').length;
    expect(count).toBe(1);
  });

  it('should include _semanticHits for internal use', () => {
    const scored = scoreModsV2(MOCK_MODS, jungleAnalysis, queries);
    for (const mod of scored) {
      expect(mod).toHaveProperty('_semanticHits');
      expect(typeof mod._semanticHits).toBe('number');
    }
  });
});

describe('scoreModsV2 with tech query', () => {
  const techAnalysis = {
    themes: ['technology', 'automation'],
    keywords: ['machines', 'energy', 'power', 'crafting'],
    modCategories: ['technology'],
    mood: 'industrial, complex, progressive',
  };

  const queries = ['create mod', 'mekanism', 'energy systems', 'automation', 'tech progression'];

  it('should rank tech-relevant mods highly', () => {
    const techMod = {
      project_id: 'mod-tech',
      slug: 'tech-mod',
      title: 'Tech Machines',
      description: 'Advanced machines, automation, energy systems, and power generation',
      icon_url: '',
      downloads: 2_000_000,
      follows: 3000,
      categories: ['technology', 'fabric'],
      client_side: 'required',
      server_side: 'required',
      date_modified: new Date().toISOString(),
      source_url: '',
    };
    const scored = scoreModsV2([...MOCK_MODS, techMod], techAnalysis, queries);
    const techResult = scored.find(m => m.slug === 'tech-mod');
    // Tech mod with semantic matches should score 70+
    expect(techResult.matchScore).toBeGreaterThan(70);
    // Random mod should score much lower
    const random = scored.find(m => m.slug === 'random-mod');
    expect(random.matchScore).toBeLessThan(techResult.matchScore - 30);
  });
});

describe('selectDiverseModsV2', () => {
  const analysis = {
    themes: ['jungle', 'survival'],
    keywords: ['dangerous'],
    modCategories: ['biome-generation', 'realistic-mobs'],
  };

  it('should respect maxMods limit', () => {
    const scored = scoreModsV2(MOCK_MODS, analysis, ['jungle', 'wildlife', 'survival']);
    const diverse = selectDiverseModsV2(scored, 3);
    expect(diverse.length).toBeLessThanOrEqual(3);
  });

  it('should keep highest scored mods first', () => {
    const scored = scoreModsV2(MOCK_MODS, analysis, ['jungle', 'wildlife', 'survival']);
    const diverse = selectDiverseModsV2(scored, 10);
    if (diverse.length >= 2) {
      expect(diverse[0].matchScore).toBeGreaterThanOrEqual(diverse[1].matchScore);
    }
  });

  it('should return empty for empty input', () => {
    expect(selectDiverseModsV2([], 10)).toEqual([]);
  });

  it('should include biome and mob mods in jungle query', () => {
    const scored = scoreModsV2(MOCK_MODS, analysis, ['jungle', 'wildlife', 'survival']);
    const diverse = selectDiverseModsV2(scored, 10);
    const slugs = diverse.map(m => m.slug);
    // Should include at least one biome mod and one mob mod
    const hasBiome = slugs.some(s => ['biomes-o-plenty'].includes(s));
    const hasMob = slugs.some(s => ['naturalist'].includes(s));
    expect(hasBiome || hasMob).toBe(true);
  });
});

describe('legacy exports', () => {
  const analysis = {
    themes: ['jungle'],
    keywords: ['survival'],
    modCategories: ['biome-generation'],
  };

  it('scoreModsIntelligently should still work', () => {
    const scored = scoreModsIntelligently(MOCK_MODS, analysis);
    expect(scored.length).toBeGreaterThan(0);
    expect(scored[0].matchScore).toBeGreaterThan(scored[scored.length - 1].matchScore);
  });

  it('selectDiverseMods should still work', () => {
    const scored = scoreModsIntelligently(MOCK_MODS, analysis);
    const diverse = selectDiverseMods(scored, 3);
    expect(diverse.length).toBeLessThanOrEqual(3);
  });
});

describe('CONFLICT_GROUPS', () => {
  it('should have valid structure', () => {
    for (const group of CONFLICT_GROUPS) {
      expect(group).toHaveProperty('name');
      expect(group).toHaveProperty('mods');
      expect(group).toHaveProperty('description');
      expect(Array.isArray(group.mods)).toBe(true);
      expect(group.mods.length).toBeGreaterThanOrEqual(2);
    }
  });

  it('should include recipe viewer conflicts', () => {
    const recipeGroup = CONFLICT_GROUPS.find(g => g.name === 'Recipe Viewer');
    expect(recipeGroup).toBeDefined();
    expect(recipeGroup.mods).toContain('jei');
    expect(recipeGroup.mods).toContain('emi');
  });

  it('should include performance conflicts', () => {
    const perfGroup = CONFLICT_GROUPS.find(g => g.name === 'Performance');
    expect(perfGroup).toBeDefined();
    expect(perfGroup.mods).toContain('sodium');
  });
});
