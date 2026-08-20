import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { findModsForUser } from '../services/search.js';
import { generateChatResponse, checkLLMHealth } from '../services/ai.js';
import { getDb, saveDatabase } from '../db/database.js';

const router = Router();

const MAX_MESSAGE_LENGTH = 2000;
const MIN_MESSAGE_LENGTH = 5;

/**
 * POST /api/chat
 */
router.post('/', async (req, res) => {
  try {
    const { message, sessionId, minecraftVersion, loader } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length < MIN_MESSAGE_LENGTH) {
      return res.status(400).json({ error: 'Message must be at least 5 characters' });
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ error: `Message must be under ${MAX_MESSAGE_LENGTH} characters` });
    }

    const validVersions = ['fabric', 'forge', 'neoforge', 'quilt'];
    const selectedLoader = validVersions.includes(loader) ? loader : 'fabric';

    const db = getDb();
    let sid = sessionId;

    if (!sid || typeof sid !== 'string') {
      sid = uuid();
      db.sessions[sid] = {
        id: sid,
        created_at: new Date().toISOString(),
        minecraft_version: minecraftVersion || '1.20.1',
      };
      db.messages[sid] = [];
    }

    if (!db.messages[sid]) db.messages[sid] = [];

    // Cap message history to prevent memory abuse
    if (db.messages[sid].length > 50) {
      db.messages[sid] = db.messages[sid].slice(-20);
    }

    db.messages[sid].push({
      role: 'user',
      content: message.trim(),
      created_at: new Date().toISOString(),
    });

    const history = db.messages[sid].map(m => ({ role: m.role, content: m.content }));

    // Run mods search + AI response in parallel
    const modsPromise = findModsForUser(message.trim(), history, {
      minecraftVersion: minecraftVersion || '1.20.1',
      loader: selectedLoader,
    });

    const modsResult = await modsPromise;
    const { mods, analysis, dependencies } = modsResult;

    // Generate AI response now that we have mods
    const aiResponse = await generateChatResponse(message.trim(), mods, history);

    db.messages[sid].push({
      role: 'assistant',
      content: aiResponse,
      created_at: new Date().toISOString(),
    });

    saveDatabase();

    res.json({
      sessionId: sid,
      aiResponse,
      mods,
      dependencies,
      analysis: {
        themes: analysis.themes,
        difficulty: analysis.difficulty,
        gameplayStyle: analysis.gameplayStyle,
      },
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process your request' });
  }
});

/**
 * GET /api/chat/history/:sessionId
 */
router.get('/history/:sessionId', (req, res) => {
  try {
    const db = getDb();
    const { sessionId } = req.params;

    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Invalid session ID' });
    }

    const session = db.sessions[sessionId];
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const messages = db.messages[sessionId] || [];
    const selectedMods = Object.keys(db.selectedMods[sessionId] || {});

    res.json({ session, messages, selectedMods });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load session' });
  }
});

/**
 * GET /api/chat/health
 */
router.get('/health', async (req, res) => {
  const health = await checkLLMHealth();
  res.json(health);
});

export default router;
