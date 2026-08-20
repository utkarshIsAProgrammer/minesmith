import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'minesmith.json');
const BACKUP_DIR = path.join(DB_DIR, 'backups');
const MAX_BACKUPS = 3;
let lastBackupTime = 0;
const BACKUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

let data = {
  sessions: {},
  messages: {},
  selectedMods: {},
  packs: {},
};

export function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  // Try to restore from latest backup if main file is corrupted
  if (fs.existsSync(DB_PATH)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      // Main file corrupted — try latest backup
      const restored = restoreFromBackup();
      if (!restored) {
        data = { sessions: {}, messages: {}, selectedMods: {}, packs: {} };
      }
    }
  }

  saveDatabase();
}

export function getDb() {
  return data;
}

export function saveDatabase() {
  try {
    // Create backup before overwriting (every 5 minutes)
    if (Date.now() - lastBackupTime > BACKUP_INTERVAL && fs.existsSync(DB_PATH)) {
      createBackup();
      lastBackupTime = Date.now();
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Silent fail — will retry on next save
  }
}

function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `minesmith-${timestamp}.json`);
    fs.copyFileSync(DB_PATH, backupPath);

    // Rotate — keep only last MAX_BACKUPS
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('minesmith-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (const old of backups.slice(MAX_BACKUPS)) {
      try { fs.unlinkSync(path.join(BACKUP_DIR, old)); } catch {}
    }
  } catch {}
}

function restoreFromBackup() {
  try {
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('minesmith-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (const backup of backups) {
      try {
        const content = fs.readFileSync(path.join(BACKUP_DIR, backup), 'utf-8');
        data = JSON.parse(content);
        return true;
      } catch {}
    }
  } catch {}
  return false;
}

setInterval(saveDatabase, 10000);

// Cleanup old sessions every 30 minutes (keep last 50)
setInterval(() => {
  const sessionIds = Object.keys(data.sessions);
  if (sessionIds.length > 50) {
    const sorted = sessionIds.sort((a, b) => {
      const ta = data.sessions[a]?.created_at || '';
      const tb = data.sessions[b]?.created_at || '';
      return ta.localeCompare(tb);
    });
    const toRemove = sorted.slice(0, sessionIds.length - 50);
    for (const id of toRemove) {
      delete data.sessions[id];
      delete data.messages[id];
      delete data.selectedMods[id];
    }
  }

  // Cleanup old packs (keep last 100)
  const packSlugs = Object.keys(data.packs);
  if (packSlugs.length > 100) {
    const sorted = packSlugs.sort((a, b) => {
      const ta = data.packs[a]?.created_at || '';
      const tb = data.packs[b]?.created_at || '';
      return ta.localeCompare(tb);
    });
    const toRemove = sorted.slice(0, packSlugs.length - 100);
    for (const slug of toRemove) {
      delete data.packs[slug];
    }
  }
}, 30 * 60 * 1000);

process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });
