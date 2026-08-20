import { Router } from 'express';

const router = Router();

const MODRINTH_API = 'https://api.modrinth.com/v2';
const HEADERS = { 'User-Agent': 'MineSmith/1.0.0', Accept: 'application/json' };

let cachedVersions = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000;

router.get('/', async (req, res) => {
  try {
    const { type = 'release', limit } = req.query;

    if (!cachedVersions || Date.now() - cacheTime > CACHE_TTL) {
      const response = await fetch(`${MODRINTH_API}/tag/game_version`, {
        headers: HEADERS, signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Modrinth error: ${response.status}`);
      cachedVersions = await response.json();
      cacheTime = Date.now();
    }

    let versions = cachedVersions;
    if (type !== 'all') {
      versions = versions.filter(v => v.version_type === type);
    }

    versions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const limitNum = limit ? parseInt(limit, 10) : (type === 'all' ? 100 : 50);
    versions = versions.slice(0, limitNum);

    res.json(versions.map(v => ({
      version: v.version, type: v.version_type, date: v.date, major: v.major,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

router.get('/release', async (req, res) => {
  try {
    if (!cachedVersions || Date.now() - cacheTime > CACHE_TTL) {
      const response = await fetch(`${MODRINTH_API}/tag/game_version`, {
        headers: HEADERS, signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Modrinth error: ${response.status}`);
      cachedVersions = await response.json();
      cacheTime = Date.now();
    }

    const releases = cachedVersions
      .filter(v => v.version_type === 'release')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .map(v => ({ version: v.version, type: v.version_type, date: v.date, major: v.major }));

    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch versions' });
  }
});

export default router;
