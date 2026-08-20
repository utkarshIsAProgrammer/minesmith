# ⚒️ MineSmith

**AI-powered Minecraft modpack builder.** Describe your dream Minecraft gameplay, and MineSmith finds the perfect mods from Modrinth — download everything as a single zip.

> *"Describe your dream Minecraft. We build the modpack."*

---

## 🎯 How It Works

1. **Describe** — Type what kind of Minecraft experience you want (e.g., "Amazon rainforest survival with real dangers")
2. **AI Analyzes** — Qwen 3.5 (local LLM) extracts themes, keywords, and search queries
3. **Search** — Queries Modrinth API for matching mods
4. **Curate** — AI scores results, explains why each mod matches your vision
5. **Download** — Add mods to cart, download as a single zip with one click

---

## 🛠️ Tech Stack

| Component | Technology | Cost |
|-----------|-----------|------|
| Frontend | React + TailwindCSS + Vite | Free |
| Backend | Node.js + Express | Free |
| LLM | Ollama + Qwen 3.5 9B | Free (local) |
| Mod Data | Modrinth API v2 | Free |
| Database | SQLite | Free |
| Hosting | Vercel + Render | Free tier |

---

## 🚀 Setup

### Prerequisites
- Node.js 18+
- Ollama installed with Qwen 3.5: `ollama pull qwen3.5:9b`

### 1. Start Ollama
```bash
ollama serve
```

### 2. Start the Backend
```bash
cd server
npm install
npm run dev
```
Server runs on `http://localhost:5000`

### 3. Start the Frontend
```bash
cd client
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

### 4. Open in Browser
Visit `http://localhost:5173` and start building your modpack!

---

## 📁 Project Structure

```
minesmith/
├── docs/
│   └── SPECIFICATIONS.md     # Full software spec
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/        # UI components
│   │   ├── pages/             # Route pages
│   │   ├── store/             # Zustand state
│   │   └── services/          # API calls
│   └── package.json
├── server/                    # Express backend
│   ├── src/
│   │   ├── routes/            # API routes
│   │   ├── services/          # AI, Modrinth, search
│   │   └── db/                # SQLite database
│   └── package.json
└── README.md
```

---

## 🧠 How the AI Works

1. User types a description in natural language
2. Qwen 3.5 extracts: themes, keywords, mood, difficulty, gameplay style
3. Generates 6-10 targeted Modrinth search queries
4. Backend searches Modrinth in parallel, deduplicates results
5. Each mod is scored (0-100%) based on keyword match, popularity, and recency
6. AI generates a short "why suggested" explanation for each mod

---

## 📝 License

Built for educational purposes. Mods sourced from [Modrinth](https://modrinth.com).
