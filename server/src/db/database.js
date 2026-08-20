import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.join(__dirname, '../../data');
const DB_PATH = path.join(DB_DIR, 'minesmith.json');

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

  if (fs.existsSync(DB_PATH)) {
    try {
      data = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    } catch {
      data = { sessions: {}, messages: {}, selectedMods: {}, packs: {} };
    }
  }

  saveDatabase();
}

export function getDb() {
  return data;
}

export function saveDatabase() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch {
    // Silent fail — will retry on next save
  }
}

setInterval(saveDatabase, 10000);
process.on('exit', saveDatabase);
process.on('SIGINT', () => { saveDatabase(); process.exit(); });
process.on('SIGTERM', () => { saveDatabase(); process.exit(); });
