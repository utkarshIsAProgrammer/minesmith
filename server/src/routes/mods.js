import { Router } from 'express';
import { getModDetails, getModVersions } from '../services/modrinth.js';

const router = Router();

const MOD_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

router.get('/:modId', async (req, res) => {
  try {
    const { modId } = req.params;
    if (!modId || !MOD_ID_REGEX.test(modId)) {
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
    if (!modId || !MOD_ID_REGEX.test(modId)) {
      return res.status(400).json({ error: 'Invalid mod ID' });
    }
    const versions = await getModVersions(modId, req.query);
    res.json(versions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch mod versions' });
  }
});

export default router;
