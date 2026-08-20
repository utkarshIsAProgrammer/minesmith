/**
 * MineSmith AI Service
 * Uses user-configured providers with automatic fallback.
 * Provider priority: User choice → Groq → Ollama
 */

import { getUserSettings } from './settings.js';

const providerHealth = {
  groq: { lastFail: 0, failCount: 0, cooldownMs: 0 },
  ollama: { lastFail: 0, failCount: 0, cooldownMs: 0 },
};

function stripThinkTags(text) {
  if (!text) return '';
  return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isInCooldown(provider) {
  const h = providerHealth[provider];
  if (!h) return false;
  return Date.now() - h.lastFail < h.cooldownMs;
}

function recordFailure(provider) {
  const h = providerHealth[provider];
  if (!h) return;
  h.failCount++;
  h.lastFail = Date.now();
  h.cooldownMs = Math.min(60_000, 5_000 * Math.pow(2, Math.min(h.failCount - 1, 3)));
}

function recordSuccess(provider) {
  const h = providerHealth[provider];
  if (!h) return;
  h.failCount = 0;
  h.cooldownMs = 0;
}

async function groqChat(messages, settings, options = {}) {
  const { temperature = 0.7, maxTokens = 2048 } = options;
  const apiKey = settings.groqApiKey;
  const model = settings.groqModel || 'qwen/qwen3.6-27b';
  if (!apiKey) throw new Error('No API key configured');

  for (let attempt = 0; attempt <= 2; attempt++) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get('retry-after') || '5', 10);
        if (attempt < 2) { await sleep(retryAfter * 1000); continue; }
        throw new Error('Rate limited');
      }
      if (!res.ok) throw new Error(`API error (${res.status})`);
      const data = await res.json();
      recordSuccess('groq');
      return stripThinkTags(data.choices?.[0]?.message?.content || '');
    } catch (err) {
      if (attempt < 2 && err.message?.includes('rate limit')) { await sleep(3000 * (attempt + 1)); continue; }
      throw err;
    }
  }
}

async function ollamaChat(messages, settings, options = {}) {
  const { temperature = 0.7, maxTokens = 2048 } = options;
  const baseUrl = settings.ollamaBaseUrl || 'http://localhost:11434';
  const model = settings.ollamaModel || 'qwen3.5:9b';

  for (let attempt = 0; attempt <= 1; attempt++) {
    try {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model, messages, stream: false, think: false,
          options: { temperature, num_predict: maxTokens, num_ctx: 4096 },
        }),
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`Ollama error (${res.status})`);
      const data = await res.json();
      recordSuccess('ollama');
      return stripThinkTags(data.message?.content || '');
    } catch (err) {
      if (attempt < 1) { await sleep(2000); continue; }
      throw err;
    }
  }
}

export async function chat(messages, options = {}) {
  const settings = getUserSettings();
  const primary = settings.provider || 'groq';
  const providers = [primary, ...['groq', 'ollama'].filter(p => p !== primary)];

  for (const provider of providers) {
    if (isInCooldown(provider)) continue;
    try {
      let result;
      if (provider === 'groq') result = await groqChat(messages, settings, options);
      else if (provider === 'ollama') result = await ollamaChat(messages, settings, options);
      else continue;
      return { provider, content: result };
    } catch (err) {
      recordFailure(provider);
    }
  }
  throw new Error('All AI providers are unavailable. Please try again later.');
}

export async function extractKeywords(userMessage, chatHistory = []) {
  const systemPrompt = `You are MineSmith, a Minecraft modpack expert. Analyze the user's dream gameplay description and return highly specific search data as JSON.

YOUR JOB: Understand what the user WANTS to FEEL and EXPERIENCE, then find the EXACT mods that create that experience.

Mod categories to consider:
- biome-generation: new biomes, worldgen, terrain, caves, dimensions
- realistic-mobs: real animals, creatures, wildlife, fauna
- survival-overhaul: thirst, temperature, health, hunger, body mechanics
- immersive-audio: sounds, ambiance, sound physics, reverb
- weather-effects: seasons, storms, rain, climate
- realism: no tree punching, realistic mechanics, grounded gameplay
- danger: hostile mobs, predators, difficulty, threats
- exploration: structures, adventure, dungeons, ruins, loot
- technology: machines, automation, tech progression, energy
- crafting-utility: recipe viewers, inventory management, maps
- decoration: furniture, building blocks, aesthetic
- magic: spells, enchantments, mystical elements

CRITICAL RULES:
- ONLY include categories that DIRECTLY match what the user described
- NEVER suggest performance mods unless explicitly asked
- NEVER suggest crafting utility unless explicitly asked
- Each search query targets a DIFFERENT aspect — no overlap
- Think: what combination of mods creates the MOST COHESIVE experience?
- Focus on what the user DESCRIBED, not generic modpack advice
- Generate 15-20 search queries covering ALL DIFFERENT aspects
- Each query: 1-3 words, specific mod names or concepts
- GOOD: "naturalist animals", "tough as nails thirst", "sound physics reverb", "serene seasons temperature"
- BAD: "sodium", "jei", "performance optimization"
- Include specific mod names when you know them (e.g., "alexs mobs", "create mod")
- Include concept-based queries (e.g., "cave dwelling", "dark atmosphere", "medieval architecture")

Return ONLY valid JSON, no markdown:
{
  "themes": ["jungle", "survival", "danger"],
  "keywords": ["realistic animals", "thirst mechanic", "hostile creatures"],
  "searchQueries": ["naturalist animals", "tough as nails", "cave dweller", "sound physics", "no tree punching"],
  "modCategories": ["biome-generation", "realistic-mobs", "survival-overhaul", "danger"],
  "mood": "intense, dangerous, immersive"
}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const { content } = await chat(messages, { temperature: 0.3, maxTokens: 4096 });

  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        let jsonStr = match[0].replace(/\.\.\./g, '').replace(/,\s*([}\]])/g, '$1').replace(/\n/g, ' ').replace(/\t/g, ' ');
        return JSON.parse(jsonStr);
      } catch {
        function parseArr(s) {
          if (!s) return [];
          return s.split(',').map(v => v.trim().replace(/["']/g, '')).filter(Boolean);
        }
        return {
          themes: parseArr(content.match(/"themes"\s*:\s*\[([^\]]*)\]/)?.[1]),
          keywords: parseArr(content.match(/"keywords"\s*:\s*\[([^\]]*)\]/)?.[1]),
          modCategories: parseArr(content.match(/"modCategories"\s*:\s*\[([^\]]*)\]/)?.[1]),
          searchQueries: parseArr(content.match(/"searchQueries"\s*:\s*\[([^\]]*)\]/)?.[1]),
        };
      }
    }
    throw new Error('Failed to parse response');
  }
}

export async function generateChatResponse(userMessage, mods, chatHistory = []) {
  const modList = mods.slice(0, 10).map(
    (m, i) => `${i + 1}. ${m.title} — ${m.description}`
  ).join('\n');

  const systemPrompt = `You are MineSmith, a friendly Minecraft modpack assistant. You've just suggested mods based on the user's dream gameplay.

Mods found:
${modList}

Respond in a friendly, enthusiastic way. Mention 2-3 standout mods by name and WHY they're perfect for the user's vision. Ask if they want to refine or download. Keep it under 4 sentences.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const { content } = await chat(messages, { temperature: 0.7, maxTokens: 2048 });
  return content;
}

export async function checkLLMHealth() {
  const settings = getUserSettings();
  const results = { groq: false, ollama: false, models: {}, primary: settings.provider };

  if (settings.groqApiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${settings.groqApiKey}` },
        body: JSON.stringify({ model: settings.groqModel, messages: [{ role: 'user', content: 'say ok' }], max_tokens: 50, temperature: 0 }),
        signal: AbortSignal.timeout(15_000),
      });
      results.groq = res.ok;
      results.models.groq = settings.groqModel;
    } catch { results.groq = false; }
  }

  try {
    const res = await fetch(`${settings.ollamaBaseUrl || 'http://localhost:11434'}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = await res.json();
      results.ollama = true;
      results.models.ollama = data.models?.map(m => m.name) || [];
    }
  } catch { results.ollama = false; }

  return results;
}
