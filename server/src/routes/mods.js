import { Router } from 'express';
import { getModDetails, getModVersions } from '../services/modrinth.js';

const router = Router();

router.get('/:modId', async (req, res) => {
  try {
    const { modId } = req.params;
    if (!modId || typeof modId !== 'string') {
      return res.status(400).json({ error: 'Invalid mod ID' });
    }
    const details = await getModDetails(modId);
    res.json(details);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mod details' });
  }
});

router.get('/:modId/versions', async (req, res) => {
  try {
    const { modId } = req.params;
    if (!modId || typeof modId !== 'string') {
      return res.status(400).json({ error: 'Invalid mod ID' });
    }
    const versions = await getModVersions(modId, req.query);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mod versions' });
  }
});

export default router;
