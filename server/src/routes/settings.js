import { Router } from 'express';
import { getUserSettings, saveUserSettings, testProvider } from '../services/settings.js';

const router = Router();

/**
 * GET /api/settings
 * Returns current user settings (keys are masked)
 */
router.get('/', (req, res) => {
  try {
    const settings = getUserSettings();
    // Mask API keys for security
    res.json({
      ...settings,
      groqApiKey: settings.groqApiKey ? maskKey(settings.groqApiKey) : '',
      openaiApiKey: settings.openaiApiKey ? maskKey(settings.openaiApiKey) : '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/settings
 * Update user settings
 */
router.put('/', (req, res) => {
  try {
    const updates = req.body;
    const settings = saveUserSettings(updates);
    res.json({
      ...settings,
      groqApiKey: settings.groqApiKey ? maskKey(settings.groqApiKey) : '',
      openaiApiKey: settings.openaiApiKey ? maskKey(settings.openaiApiKey) : '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/settings/test
 * Test a provider connection
 */
router.post('/test', async (req, res) => {
  try {
    const { provider, endpoint, apiKey, model } = req.body;
    const result = await testProvider(provider, { endpoint, apiKey, model });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/settings/providers
 * List available providers and their status
 */
router.get('/providers', async (req, res) => {
  try {
    const settings = getUserSettings();
    const providers = [
      {
        id: 'groq',
        name: 'Groq',
        description: 'Fast cloud inference (free tier available)',
        configured: !!settings.groqApiKey,
        models: [],
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        description: 'Run models on your machine (100% free, offline)',
        configured: true,
        models: [],
      },
      {
        id: 'openai-compatible',
        name: 'OpenAI-Compatible API',
        description: 'Any API that follows OpenAI format (LM Studio, text-generation-webui, etc.)',
        configured: !!settings.openaiApiKey && !!settings.openaiEndpoint,
        models: [],
      },
    ];

    // Fetch Groq models if key is configured
    if (settings.groqApiKey) {
      try {
        const res = await fetch('https://api.groq.com/openai/v1/models', {
          headers: { 'Authorization': `Bearer ${settings.groqApiKey}` },
          signal: AbortSignal.timeout(5000),
        });
        if (res.ok) {
          const data = await res.json();
          providers[0].models = (data.data || [])
            .filter(m => m.id && !m.id.includes('whisper') && !m.id.includes('tts') && !m.id.includes('embedding'))
            .map(m => m.id)
            .sort();
        }
      } catch {}
    }

    // Check Ollama for available models
    try {
      const res = await fetch(`${settings.ollamaBaseUrl || 'http://localhost:11434'}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) {
        const data = await res.json();
        providers[1].models = data.models?.map(m => m.name) || [];
        providers[1].configured = providers[1].models.length > 0;
      }
    } catch {}

    res.json(providers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function maskKey(key) {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
}

export default router;
