# MineSmith — Software Specification Document

> **Version:** 1.0  
> **Date:** August 2026  
> **Author:** [Your Name]  
> **Project Type:** Full-Stack Web Application  

---

## 1. Project Overview

### 1.1 What is MineSmith?

MineSmith is an AI-powered web application that allows users to describe their ideal Minecraft gameplay experience in natural language and receive a curated, compatible list of mods from Modrinth that match their vision. Users can browse suggested mods, add them to a cart, refine their preferences through continued conversation, and download all selected mods as a single `.zip` file.

### 1.2 Problem Statement

Minecraft modding is overwhelming for both beginners and experienced players. Finding mods that:
- Match a specific gameplay vision
- Work together without conflicts
- Are compatible with the user's Minecraft version
- Are trustworthy and well-maintained

...requires hours of research, Reddit threads, and trial-and-error. MineSmith solves this by using AI to bridge the gap between a user's imagination and the right mods.

### 1.3 Target Audience

- Minecraft players (beginners to intermediate)
- Content creators looking for themed modpacks
- Students and educators using Minecraft for learning
- Anyone who has imagined "what if Minecraft was like X?"

### 1.4 Core Value Proposition

> *"Describe your dream Minecraft. We build the modpack."*

---

## 2. Features

### 2.1 Core Features (MVP)

#### F1 — Natural Language Input
- User types a description of their desired gameplay (e.g., "Amazon rainforest survival")
- Supports free-form text, multiple sentences, detailed or vague descriptions
- Minimum 10 characters, maximum 2000 characters

#### F2 — AI-Powered Analysis
- LLM processes the user's description
- Extracts: themes, keywords, mood, difficulty, gameplay style, biome preferences
- Returns structured JSON for the backend to process
- Response time target: < 3 seconds

#### F3 — Smart Mod Search
- Translates AI-extracted keywords into Modrinth API search queries
- Executes multiple parallel searches across categories
- Deduplicates results
- Filters by: relevance, download count, last updated date, Modrinth score

#### F4 — Curated Mod Display
- Each mod card shows:
  - Mod icon/image (from Modrinth CDN)
  - Mod name
  - Short description
  - **"Why this mod"** — AI-generated explanation of why it matches the user's request
  - Match confidence score (0-100%)
  - Modrinth link (external)
  - Download count
  - Minecraft version compatibility
  - Supported loaders (Forge/Fabric/NeoForge)
- Sorted by match confidence score (highest first)

#### F5 — Mod Cart System
- Users can add/remove mods from a cart
- Cart persists during the session
- Cart shows total mod count and estimated size
- Cart is visible in a sidebar/drawer

#### F6 — One-Click Download
- Downloads all cart mods as a single `.zip` file
- Zip contains:
  - All `.jar` files fetched directly from Modrinth CDN
  - `README.md` with mod list, descriptions, and credits
  - `manifest.json` with metadata (mod versions, sources)
- Files are NOT stored on the server — streamed directly from Modrinth

#### F7 — Mod Detail View
- Clicking a mod shows:
  - Full description
  - All images/screenshots from Modrinth
  - Version history
  - Supported Minecraft versions
  - Supported loaders
  - Source/issue links

### 2.2 Enhanced Features (Full Version)

#### F8 — Chat Refinement Loop
- After initial suggestions, user can continue chatting:
  - "Add more atmospheric mods"
  - "Remove anything too performance-heavy"
  - "Make it more horror-like"
  - "I also want farming mods"
- AI understands context of the previous conversation
- Updates the suggested mod list intelligently

#### F9 — Compatibility Checker
- Cross-references selected mods for known conflicts
- Checks loader compatibility (e.g., Forge mods vs Fabric mods)
- Warns user: "These 2 mods may conflict — here's an alternative"
- Uses Modrinth's dependency information

#### F10 — Minecraft Version Selector
- User selects their Minecraft version (1.18.2, 1.19.4, 1.20.1, 1.21, etc.)
- All search results filtered to only show compatible mods
- Version selector available before and after AI suggestions

#### F11 — Pack Summary Dashboard
```
🌿 "Amazon Rainforest Pack"
├── 12 mods selected
├── Compatible: ✅ All verified
├── Performance Impact: 🟡 Medium (4GB+ RAM recommended)
├── Difficulty: ⭐⭐⭐⭐⭐ Hardcore
├── Total Size: 45.2 MB
├── Loader: Forge 1.20.1
└── [Download .zip]  [Share Pack Link]
```

#### F12 — Shareable Pack Links
- Generate unique URL: `minesmith.app/pack/abc123`
- Anyone can view and download the same modpack
- Pack data stored in database
- No authentication required to view

#### F13 — Modpack Export Formats
- `.zip` (default — all jars)
- `.mrpack` (Modrinth format — importable in Modrinth Launcher)
- `modlist.html` (CurseForge-style mod list)

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────┐
│                    CLIENT (React)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Chat UI  │  │ Mod Grid │  │   Cart Sidebar    │   │
│  └────┬─────┘  └────┬─────┘  └────────┬─────────┘   │
│       └──────────────┼─────────────────┘             │
│                      │ HTTP/REST                      │
└──────────────────────┼──────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────┐
│                SERVER (Express)                       │
│  ┌───────────────────┼──────────────────────────┐    │
│  │              API Gateway                      │    │
│  │  ┌──────┐  ┌──────┴──────┐  ┌────────────┐  │    │
│  │  │ Chat │  │  Mod Search │  │    Zip      │  │    │
│  │  │Module│  │   Module    │  │  Builder    │  │    │
│  │  └──┬───┘  └──────┬──────┘  └─────┬──────┘  │    │
│  └─────┼──────────────┼───────────────┼─────────┘    │
│        │              │               │               │
│  ┌─────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐        │
│  │  Ollama   │  │  Modrinth  │  │  Modrinth│        │
│  │  (Local)  │  │   API v2   │  │   CDN    │        │
│  │  Qwen 3.5 │  │            │  │          │        │
│  └───────────┘  └────────────┘  └──────────┘        │
└──────────────────────────────────────────────────────┘
```

### 3.2 Component Breakdown

| Component | Technology | Responsibility |
|-----------|-----------|----------------|
| Frontend | React + TailwindCSS | UI, state management, API calls |
| Backend | Node.js + Express | API routing, business logic, orchestration |
| LLM Engine | Ollama (Qwen 3.5 9B) | Natural language understanding, keyword extraction |
| Mod Database | Modrinth API v2 | Mod search, metadata, downloads |
| Mod Files | Modrinth CDN | Direct .jar file downloads |
| Database | SQLite (better-sqlite3) | Pack storage, shared links, caching |
| File Packaging | archiver (npm) | .zip/.mrpack creation |

### 3.3 Data Flow

```
User Input (text)
    │
    ▼
[Express API] ─── validates input
    │
    ▼
[Ollama/Qwen 3.5] ─── extracts keywords + themes
    │
    ▼
[Modrinth Search Engine]
    ├── Search 1: "jungle biome" + "survival"
    ├── Search 2: "wildlife" + "animals"
    ├── Search 3: "realistic" + "danger"
    ├── Search 4: "temperature" + "weather"
    └── Search 5: "atmosphere" + "sounds"
    │
    ▼
[Deduplication + Scoring]
    │
    ▼
[AI "Why Suggested" Generator] ─── batch generates explanations
    │
    ▼
Response to Client ─── { mods: [...], matchScores: [...] }
```

---

## 4. API Design

### 4.1 Backend Endpoints

#### Chat & Search
```
POST   /api/chat
Body:  { message: string, sessionId: string, minecraftVersion?: string }
Response: {
  mods: Mod[],
  sessionId: string,
  aiResponse: string (conversational reply)
}
```

#### Mod Operations
```
GET    /api/mods/:modId
Response: { mod: ModDetail }

GET    /api/mods/:modId/versions
Response: { versions: ModVersion[] }
```

#### Pack Management
```
POST   /api/packs/create
Body:  { modIds: string[], name?: string, description?: string }
Response: { packId: string, shareUrl: string }

GET    /api/packs/:packId
Response: { pack: PackDetail }

GET    /api/packs/:packId/download
Response: stream (.zip file)
```

#### Session
```
POST   /api/session/create
Response: { sessionId: string }

GET    /api/session/:sessionId/history
Response: { messages: Message[], mods: Mod[] }
```

### 4.2 External API Usage

#### Modrinth API v2
```
Base URL: https://api.modrinth.com/v2

GET /search
Params: query, facets, limit, index, offset

GET /project/{id}
GET /project/{id}/version

Download: https://cdn.modrinth.com/data/{id}/versions/{version_id}/{filename}
```

#### Ollama API
```
Base URL: http://localhost:11434

POST /api/chat
Body: {
  model: "qwen3.5:9b",
  messages: [...],
  format: "json",
  stream: false
}
```

---

## 5. Data Models

### 5.1 Mod (from Modrinth)
```json
{
  "id": "string",
  "slug": "string",
  "title": "string",
  "description": "string",
  "body": "string",
  "icon_url": "string",
  "categories": ["string"],
  "loaders": ["string"],
  "versions": ["string"],
  "downloads": "number",
  "follows": "number",
  "date_created": "datetime",
  "date_modified": "datetime",
  "latest_version": "string",
  "license": "string",
  "source_url": "string",
  "project_url": "string"
}
```

### 5.2 Enhanced Mod (with MineSmith data)
```json
{
  ...Mod,
  "matchScore": "number (0-100)",
  "whySuggested": "string",
  "selectedByUser": "boolean",
  "category": "string (user-facing category)"
}
```

### 5.3 Session
```json
{
  "id": "string (uuid)",
  "createdAt": "datetime",
  "messages": [
    {
      "role": "user | assistant",
      "content": "string",
      "timestamp": "datetime"
    }
  ],
  "selectedMods": ["modId"],
  "minecraftVersion": "string",
  "packName": "string"
}
```

### 5.4 Pack
```json
{
  "id": "string (uuid)",
  "name": "string",
  "description": "string",
  "modIds": ["string"],
  "minecraftVersion": "string",
  "loader": "string",
  "createdAt": "datetime",
  "downloads": "number",
  "shareSlug": "string"
}
```

### 5.5 AI Analysis Result
```json
{
  "themes": ["survival", "jungle", "realism"],
  "keywords": ["tropical", "wildlife", "danger", "weather", "temperature"],
  "mood": "immersive, challenging, atmospheric",
  "difficulty": "hard",
  "gameplayStyle": "survival",
  "biomes": ["jungle", "swamp"],
  "categories": [
    "world-gen", "mobs", "atmosphere",
    "temperature", "realism", "difficulty"
  ]
}
```

---

## 6. LLM Prompt Engineering

### 6.1 System Prompt (Keyword Extraction)

```
You are MineSmith, an expert Minecraft mod analyst. Your job is to
analyze a user's description of their ideal Minecraft gameplay and
extract structured data to search for relevant mods.

Rules:
1. Only extract keywords that map to actual Minecraft mod categories
2. Be specific — "realistic animals" is better than "animals"
3. Consider mood, atmosphere, difficulty, and gameplay mechanics
4. Think about what kinds of mods would make this vision real
5. Return ONLY valid JSON, no extra text

Output format:
{
  "themes": ["theme1", "theme2"],
  "keywords": ["keyword1", "keyword2", ...],
  "mood": "description of mood",
  "difficulty": "easy|medium|hard|hardcore",
  "gameplayStyle": "survival|creative|adventure|horror",
  "biomes": ["biome1", "biome2"],
  "categories": ["mod-category1", "mod-category2"],
  "searchQueries": [
    "query1 for Modrinth API",
    "query2 for Modrinth API"
  ]
}
```

### 6.2 Search Query Generation

The AI should generate 5-10 targeted search queries:

```
Example for "Amazon rainforest survival":
1. "jungle biome realistic"
2. "tropical wildlife animals"
3. "survival temperature heat"
4. "realistic weather rain"
5. "dangerous mobs predators"
6. "natural atmosphere sounds"
7. "realistic plants vegetation"
8. "hardcore survival mechanics"
9. "humidity thirst dehydration"
10. "dense forest generation"
```

### 6.3 "Why Suggested" Prompt

```
For each mod, explain in one short sentence why it matches the
user's vision. Be specific and reference the user's original
description. Example:

User said: "Amazon rainforest survival with real dangers"
Mod: "Tough As Nails"
→ "Adds thirst and temperature mechanics essential for
   surviving the extreme heat of a rainforest"

Keep it under 15 words. Be direct.
```

---

## 7. Frontend Design

### 7.1 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Landing page with description input |
| Session | `/chat/:sessionId` | Chat interface with mod results |
| Pack | `/pack/:packId` | Shared pack view (public) |
| Mod Detail | `/mod/:modId` | Full mod information |

### 7.2 Key UI Components

```
┌─────────────────────────────────────────────────┐
│  MineSmith ⚒️                    [Minecraft: ▼]  │
├───────────────────────────┬─────────────────────┤
│                           │                     │
│   Chat Messages           │   Mod Results       │
│   ┌─────────────────┐     │   ┌──────────────┐  │
│   │ User: I want... │     │   │ Mod Card 1   │  │
│   └─────────────────┘     │   │ [img] name   │  │
│   ┌─────────────────┐     │   │ score: 95%   │  │
│   │ MineSmith: Here │     │   │ why: ...     │  │
│   │ are 8 mods...   │     │   │ [Add to Cart]│  │
│   └─────────────────┘     │   └──────────────┘  │
│                           │   ┌──────────────┐  │
│   ┌─────────────────┐     │   │ Mod Card 2   │  │
│   │ Type message... │     │   │ ...          │  │
│   └─────────────────┘     │   └──────────────┘  │
│                           │                     │
├───────────────────────────┴─────────────────────┤
│  Cart: 5 mods  │  Total: 45.2 MB  │ [Download] │
└─────────────────────────────────────────────────┘
```

### 7.3 Mod Card Design

```
┌──────────────────────────────────────┐
│  [🖼️ Icon]  Mod Name           95%  │
│            Short description here    │
│                                      │
│  💡 "Adds realistic temperature      │
│     mechanics for rainforest         │
│     survival"                        │
│                                      │
│  📦 1.2MB  ⬇️ 2.1M  🔧 Forge/Fabric │
│                                      │
│  [Add to Cart]  [View on Modrinth]   │
└──────────────────────────────────────┘
```

---

## 8. Tech Stack

### 8.1 Frontend
| Tool | Purpose | Cost |
|------|---------|------|
| React 18 | UI framework | Free |
| TailwindCSS | Styling | Free |
| React Router | Navigation | Free |
| Zustand | State management | Free |
| Lucide React | Icons | Free |
| Vercel | Hosting | Free tier |

### 8.2 Backend
| Tool | Purpose | Cost |
|------|---------|------|
| Node.js | Runtime | Free |
| Express | HTTP framework | Free |
| better-sqlite3 | Database | Free |
| cors | Cross-origin | Free |
| dotenv | Environment | Free |
| uuid | ID generation | Free |
| archiver | Zip creation | Free |
| Render | Hosting | Free tier |

### 8.3 AI & APIs
| Tool | Purpose | Cost |
|------|---------|------|
| Ollama | Local LLM runtime | Free |
| Qwen 3.5 9B | LLM model | Free |
| Modrinth API v2 | Mod database | Free |
| Modrinth CDN | Mod file downloads | Free |

---

## 9. Project Structure

```
minesmith/
├── docs/
│   └── SPECIFICATIONS.md     ← This file
├── client/                    ← React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   ├── ChatInput.jsx
│   │   │   │   ├── ChatMessage.jsx
│   │   │   │   └── ChatWindow.jsx
│   │   │   ├── Mods/
│   │   │   │   ├── ModCard.jsx
│   │   │   │   ├── ModGrid.jsx
│   │   │   │   └── ModDetail.jsx
│   │   │   ├── Cart/
│   │   │   │   ├── CartSidebar.jsx
│   │   │   │   └── CartItem.jsx
│   │   │   ├── Layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   └── UI/
│   │   │       ├── Loader.jsx
│   │   │       └── MatchScore.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Chat.jsx
│   │   │   ├── PackView.jsx
│   │   │   └── ModDetailPage.jsx
│   │   ├── hooks/
│   │   │   ├── useChat.js
│   │   │   ├── useMods.js
│   │   │   └── useCart.js
│   │   ├── store/
│   │   │   ├── chatStore.js
│   │   │   └── cartStore.js
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                    ← Express backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── chat.js
│   │   │   ├── mods.js
│   │   │   └── packs.js
│   │   ├── services/
│   │   │   ├── ai.js          ← Ollama integration
│   │   │   ├── modrinth.js    ← Modrinth API client
│   │   │   ├── search.js      ← Search orchestration
│   │   │   └── packager.js    ← Zip/.mrpack builder
│   │   ├── db/
│   │   │   └── database.js    ← SQLite setup
│   │   ├── prompts/
│   │   │   ├── extract.js     ← Keyword extraction prompt
│   │   │   └── explain.js     ← "Why suggested" prompt
│   │   ├── middleware/
│   │   │   └── validate.js
│   │   └── app.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

---

## 10. Development Phases

### Phase 1 — Foundation (Week 1)
- [ ] Project setup (React + Express boilerplate)
- [ ] Basic chat UI
- [ ] Ollama connection + keyword extraction
- [ ] Modrinth API integration (search)
- [ ] Basic mod display grid

### Phase 2 — Core Features (Week 2)
- [ ] "Why suggested" AI explanations
- [ ] Match scoring system
- [ ] Add to cart functionality
- [ ] Zip download system
- [ ] Session persistence

### Phase 3 — Polish (Week 3)
- [ ] Mod detail view
- [ ] Compatibility warnings
- [ ] Minecraft version selector
- [ ] Pack summary dashboard
- [ ] Loading states + error handling

### Phase 4 — Advanced (Week 4)
- [ ] Chat refinement loop (context-aware follow-ups)
- [ ] Shareable pack links
- [ ] .mrpack export format
- [ ] Performance optimization
- [ ] Responsive design

---

## 11. Non-Functional Requirements

### 11.1 Performance
- AI response: < 5 seconds (local LLM)
- Mod search results: < 3 seconds
- Zip download: < 10 seconds for 20 mods
- Page load: < 2 seconds

### 11.2 Scalability
- Handle 50+ concurrent sessions
- Cache popular mod searches
- Rate limit: 10 requests/minute per IP

### 11.3 Reliability
- Graceful fallback if Ollama is down (show error message)
- Retry Modrinth API on failure (3 attempts)
- Zip generation should never fail silently

### 11.4 Security
- No user data stored without consent
- Sanitize all user inputs before LLM processing
- No server-side file storage (stream from Modrinth CDN)
- CORS configured for frontend origin only

---

## 12. Constraints

| Constraint | Detail |
|-----------|--------|
| Budget | $0 — all tools must be free |
| LLM | Must run locally via Ollama (no paid API required) |
| Mod Source | Modrinth only (free, open API) |
| No Server Storage | Mods are streamed, not cached/stored on server |
| College Submission | Must be demonstrable offline (local LLM) |
