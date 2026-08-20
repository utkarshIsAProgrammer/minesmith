import fs from 'fs';
import path from 'path';

const SETTINGS_PATH = path.join(process.cwd(), 'data', 'user-settings.json');

const DEFAULTS = {
  provider: 'groq',
  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'qwen/qwen3.6-27b',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen3.5:9b',
};

let currentSettings = null;

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8');
      currentSettings = { ...DEFAULTS, ...JSON.parse(raw) };
    } else {
      currentSettings = { ...DEFAULTS };
    }
  } catch (err) {

    currentSettings = { ...DEFAULTS };
  }
  return currentSettings;
}

export function getUserSettings() {
  if (!currentSettings) loadSettings();
  return { ...currentSettings };
}

export function saveUserSettings(updates) {
  if (!currentSettings) loadSettings();

  const allowedFields = ['provider', 'groqApiKey', 'groqModel', 'ollamaBaseUrl', 'ollamaModel', 'groqModel'];

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      currentSettings[field] = updates[field];
    }
  }

  const dataDir = path.dirname(SETTINGS_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(currentSettings, null, 2));

  return { ...currentSettings };
}

export async function testProvider(provider) {
  const settings = getUserSettings();
  const actualProvider = provider || settings.provider;

  if (actualProvider === 'groq') {
    const apiKey = settings.groqApiKey;
    if (!apiKey) return { ok: false, error: 'No API key provided' };
    try {
      // Fetch available models from Groq
      const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(10_000),
      });
      let models = [];
      if (modelsRes.ok) {
        const modelsData = await modelsRes.json();
        models = (modelsData.data || [])
          .filter(m => m.id && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('embedding'))
          .map(m => ({ id: m.id, name: m.id, owned_by: m.owned_by || '' }))
          .sort((a, b) => a.name.localeCompare(b.name));
      }

      // Test with current model or first available
      const testModel = settings.groqModel || (models[0]?.id || '');
      if (testModel) {
        const testRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
          body: JSON.stringify({ model: testModel, messages: [{ role: 'user', content: 'say ok' }], max_tokens: 10, temperature: 0 }),
          signal: AbortSignal.timeout(15_000),
        });
        if (!testRes.ok && models.length > 0) {
          // Current model doesn't work, try first available
          for (const m of models) {
            const retry = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
              body: JSON.stringify({ model: m.id, messages: [{ role: 'user', content: 'say ok' }], max_tokens: 10, temperature: 0 }),
              signal: AbortSignal.timeout(10_000),
            });
            if (retry.ok) {
              saveUserSettings({ groqModel: m.id });
              return { ok: true, model: m.id, models: models.map(m => m.id) };
            }
          }
        }
      }
      return { ok: true, model: testModel, models: models.map(m => m.id) };
    } catch (err) { return { ok: false, error: err.message }; }
  }

  if (actualProvider === 'ollama') {
    const baseUrl = settings.ollamaBaseUrl || 'http://localhost:11434';
    try {
      const res = await fetch(`${baseUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, models: data.models?.map(m => m.name) || [] };
      }
      return { ok: false, error: `HTTP ${res.status}` };
    } catch (err) {
      return { ok: false, error: `Cannot connect to ${baseUrl}. Is Ollama running?` };
    }
  }

  return { ok: false, error: `Unknown provider: ${actualProvider}` };
}

loadSettings();
