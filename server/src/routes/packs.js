import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { getDb, saveDatabase } from '../db/database.js';
import { downloadModFile, getDownloadUrl, getModVersions, getModDetails } from '../services/modrinth.js';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import { Readable } from 'stream';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { modIds, name, description, minecraftVersion, sessionId } = req.body;
    if (!modIds || !Array.isArray(modIds) || modIds.length === 0) {
      return res.status(400).json({ error: 'modIds array is required' });
    }
    const db = getDb();
    const slug = uuid().slice(0, 12);
    const pack = {
      id: uuid(),
      share_slug: slug,
      name: (name || 'MineSmith Pack').slice(0, 100),
      description: (description || '').slice(0, 500),
      minecraft_version: minecraftVersion || '1.20.1',
      mod_ids: modIds.slice(0, 100),
      downloads: 0,
      created_at: new Date().toISOString(),
    };
    db.packs[slug] = pack;
    if (sessionId && db.selectedMods) {
      db.selectedMods[sessionId] = {};
      for (const id of modIds) db.selectedMods[sessionId][id] = true;
    }
    saveDatabase();
    res.json({ packId: pack.id, shareSlug: slug, shareUrl: `/pack/${slug}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create pack' });
  }
});

router.get('/:slug', (req, res) => {
  try {
    const db = getDb();
    const pack = db.packs[req.params.slug];
    if (!pack) return res.status(404).json({ error: 'Pack not found' });

    const modDetails = [];
    for (const modId of pack.mod_ids.slice(0, 50)) {
      const cached = db.modCache?.[modId];
      if (cached) {
        modDetails.push({
          id: modId, title: cached.title, description: cached.description,
          icon_url: cached.icon_url, slug: cached.slug, downloads: cached.downloads,
          project_url: `https://modrinth.com/mod/${cached.slug}`,
        });
      }
    }
    res.json({ ...pack, mods: modDetails });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load pack' });
  }
});

router.get('/:slug/download', async (req, res) => {
  try {
    const db = getDb();
    const pack = db.packs[req.params.slug];
    if (!pack) return res.status(404).json({ error: 'Pack not found' });

    pack.downloads = (pack.downloads || 0) + 1;
    saveDatabase();

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${(pack.name || 'pack').replace(/[^a-zA-Z0-9-_]/g, '_')}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const modId of pack.mod_ids.slice(0, 50)) {
      try {
        const versions = await getModVersions(modId, {
          minecraftVersion: pack.minecraft_version,
          loader: 'fabric',
        });
        if (versions && versions.length > 0) {
          const url = getDownloadUrl(versions[0]);
          if (url) {
            const { buffer, filename } = await downloadModFile(url);
            archive.append(buffer, { name: `mods/${filename || modId + '.jar'}` });
          }
        }
      } catch {
        // Skip failed mods silently
      }
    }

    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

router.post('/download-direct', async (req, res) => {
  try {
    const { modIds, name, minecraftVersion } = req.body;
    if (!modIds || !Array.isArray(modIds) || modIds.length === 0) {
      return res.status(400).json({ error: 'modIds array is required' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${(name || 'minesmith_pack').replace(/[^a-zA-Z0-9-_]/g, '_')}.zip"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    for (const modId of modIds.slice(0, 100)) {
      try {
        const versions = await getModVersions(modId, {
          minecraftVersion: minecraftVersion || '1.20.1',
          loader: 'fabric',
        });
        if (versions && versions.length > 0) {
          const url = getDownloadUrl(versions[0]);
          if (url) {
            const { buffer, filename } = await downloadModFile(url);
            archive.append(buffer, { name: `mods/${filename || modId + '.jar'}` });
          }
        }
      } catch {
        // Skip failed mods silently
      }
    }

    // Add README
    const readme = `MineSmith Pack
===============

Built with MineSmith - AI-powered Minecraft modpack builder

Minecraft Version: ${minecraftVersion || '1.20.1'}
Mods: ${modIds.length}
Date: ${new Date().toISOString().split('T')[0]}

Installation:
1. Install Fabric or Forge for your Minecraft version
2. Copy all .jar files from the "mods" folder to your Minecraft "mods" folder
3. Launch Minecraft

For more information, visit: https://modrinth.com
`;
    archive.append(readme, { name: 'README.txt' });

    archive.finalize();
  } catch (err) {
    res.status(500).json({ error: 'Download failed' });
  }
});

export default router;
