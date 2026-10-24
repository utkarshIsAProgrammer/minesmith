# ⚒️ MineSmith — AI-Powered Minecraft Modpack Architect

<div align="center">

```
   __  ___ _             ____          _  __   __  
  /  |/  /(_)___  ___   / __/___ ___  (_)/ /_ / /_ 
 / /|_/ // // _ \/ -_) _\ \ / _ ` _ \/ // __// _ \ 
/_/  /_//_//_//_/\__/ /___//\_,_/_//_/_/ \__//_//_/ 
                                                    
   Describe your dream Minecraft. We build the modpack.
```

[![Live Demo](https://img.shields.io/badge/%E2%96%B6_Live_Demo-MineSmith-00ff9c.svg?style=for-the-badge&logo=vercel&logoColor=black)](https://minesmith-tau.vercel.app)
[![React](https://img.shields.io/badge/React-18+-20232a.svg?style=for-the-badge&logo=react&logoColor=61dafb)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.19+-000000.svg?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57.svg?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Modrinth API](https://img.shields.io/badge/Modrinth-API_v2-1BD96A.svg?style=for-the-badge&logo=modrinth&logoColor=black)](https://modrinth.com/)

[Live App](https://minesmith-tau.vercel.app) • [How It Works](#-how-it-works) • [Architecture](#-architecture) • [Features](#-key-features) • [Quickstart](#-quickstart) • [API Reference](#-api-reference) • [Configuration](#-environment-variables)

</div>

---

## 🎮 Overview

Modding Minecraft is notoriously tedious. Players spend hours sifting through forums, wikis, and repositories trying to find mods that align with their vision, support their desired game version (Fabric vs. Forge vs. Quilt), and do not crash on launch due to missing dependencies or incompatible mixins.

**MineSmith** eliminates this friction. Describe any gameplay concept in natural language (e.g. *"A harsh survival journey through an overgrown jungle with realistic thirst, dangerous wildlife, and steampunk machinery"*), and MineSmith's AI pipeline translates your prompt into targeted Modrinth search queries, filters by loader and Minecraft version, scores mod relevance, resolves dependencies, and bundles verified `.jar` files into a ready-to-play `.zip` modpack with a single click.

---

## 🎯 How It Works

```
 1. Natural Language Prompt ────────► "Amazon rainforest survival with realistic thirst & machines"
                                                      │
 2. Dual-Engine AI Decomposition                     ▼
    (Groq Llama 3.3 / Local Ollama)   Themes: [Rainforest, Survival, Thirst, Steampunk]
                                      Queries: "thirst", "jungle biomes", "create tech"
                                                      │
 3. Parallel Modrinth Ingestion                       ▼
    (Faceted search & loader matching)  Resolves: ToughAsNails, Create, Terralith, Alex's Mobs
                                                      │
 4. Relevance & Dependency Scoring                   ▼
    (0–100% match & conflict check)   Checks: Fabric API, Cloth Config, version parity
                                                      │
 5. One-Click Packaging                              ▼
    (Direct stream zip archive)       Generates: MineSmith_Modpack.zip containing:
                                      ├── mods/*.jar (all resolved binaries)
                                      └── manifest.json (pack metadata & config)
```

---

## ✨ Key Features

### 🧠 Dual-Provider AI Intelligence with Failover
- **Automatic Fallback Pipeline**: Supports ultra-fast cloud inference via **Groq** (`llama-3.3-70b-versatile`) and 100% offline local privacy via **Ollama** (`qwen3.5:9b`).
- **Resilience Engine**: Monitors provider health, automatically strips `<think>` reasoning tags, and applies exponential backoff cooldowns when rate limits occur.
- **Explainable Curation**: For every mod recommended, the AI synthesizes an on-the-fly "why suggested" justification explaining how it fits the player's prompt.

### 🔍 Deep Modrinth API v2 Integration
- **Precision Faceted Queries**: Queries Modrinth in parallel across project types, loaders (Fabric, Forge, Quilt, NeoForge), and release channels.
- **Intelligent Scoring**: Ranks results (0–100%) based on semantic keyword match, active download popularity, and update recency.
- **Dependency Detection**: Automatically discovers required library mods (e.g. Fabric API, Architectury) and warns about incompatible pairs.

### 📦 Direct Zip Packager & One-Click Downloads
- **Streaming Archiver**: Downloads genuine `.jar` mod releases on the fly and streams a bundled `.zip` directly to the user's browser.
- **Pre-Configured Manifests**: Includes a standardized `manifest.json` detailing mod versions, author credits, and Minecraft versions.
- **Direct Share Permalinks**: Save any modpack configuration to SQLite and share it via a unique slug (`/p/:slug`).

### 💻 Modern Interactive Frontend
- **Zustand State Engine**: Ephemeral cart drawer, reactive mod selection, and live search history.
- **Thinking Indicator**: Visual signal keeping the user engaged while LLMs query and aggregate mod catalogs.
- **Responsive Layout**: Designed for mobile and desktop screens with custom Tailwind CSS styling.

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client (React + Vite)                    │
│   HomePage • ChatPage • SharedPackPage • CartSidebar UI     │
└──────────────────────────────┬──────────────────────────────┘
                               │ JSON REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Backend (Node.js + Express)                   │
│                                                             │
│  ┌─────────────────────────┐     ┌───────────────────────┐  │
│  │   AI Orchestrator       │ ◄─► │  Modrinth Service     │  │
│  │   - Groq Cloud API      │     │  - Faceted Search     │  │
│  │   - Ollama Local Engine │     │  - Version Resolver   │  │
│  └────────────┬────────────┘     └───────────┬───────────┘  │
│               │                              │              │
│               ▼                              ▼              │
│  ┌─────────────────────────┐     ┌───────────────────────┐  │
│  │   Packager Service      │     │  SQLite Store         │  │
│  │   - Stream Archiver     │     │  - Saved Packs        │  │
│  │   - Jar Downloader      │     │  - Search Cache       │  │
│  └─────────────────────────┘     └───────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite 5, TypeScript | Single-page application with modular components |
| **State Management**| Zustand | Lightweight stores (`cartStore.ts`, `chatStore.ts`) |
| **Styling** | Tailwind CSS 3.4 | Custom Minecraft-inspired dark color palette |
| **Icons** | Lucide React | Modern SVG iconography |
| **Backend** | Node.js, Express 4.19 | Asynchronous REST API service |
| **Local LLM** | Ollama (`qwen3.5:9b`) | Local zero-cost neural engine |
| **Cloud LLM** | Groq SDK (`llama-3.3-70b-versatile`)| Ultra-fast token generation free tier |
| **Mod Source** | Modrinth API v2 | Official REST API for Minecraft mods |
| **Packaging** | Archiver | In-memory / streamed multi-part zip packaging |
| **Database** | SQLite (`better-sqlite3`) | Fast embedded relational database |
| **Deployment** | Vercel (Client) + Render (API) | Free-tier zero-cost architecture |

---

## 📁 Repository Structure

```
minesmith/
├── client/                     # React 18 frontend
│   ├── src/
│   │   ├── components/         # ModCard, CartSidebar, ConflictWarning, ThinkingIndicator
│   │   ├── pages/              # HomePage, ChatPage, SharedPackPage, NotFoundPage
│   │   ├── store/              # Zustand stores (cartStore, chatStore)
│   │   ├── services/           # Axios API bindings
│   │   └── App.tsx             # Root router and layout
│   ├── package.json
│   └── vite.config.ts
├── server/                     # Express backend
│   ├── src/
│   │   ├── db/                 # SQLite database schema and helper functions
│   │   ├── routes/             # chat, mods, packs, versions, settings
│   │   ├── services/           # ai.js, modrinth.js, packager.js, search.js
│   │   ├── middleware/         # Request logger and error interceptors
│   │   └── app.js              # Express app bootstrap
│   ├── data/                   # SQLite database file storage
│   └── package.json
├── docs/                       # Project specifications (SPECIFICATIONS.md)
└── README.md
```

---

## 🚀 Quickstart

### Prerequisites
- **Node.js 18+** & **npm**
- *(Optional for cloud AI)*: A free [Groq API Key](https://console.groq.com/)
- *(Optional for local AI)*: [Ollama](https://ollama.com/) with Qwen: `ollama pull qwen3.5:9b`

---

### 1. Server Setup

```bash
cd server

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
# Open .env and insert your GROQ_API_KEY (or use local Ollama)

# Start backend development server
npm run dev
```

Backend will run at `http://localhost:5000`. Test endpoint:
```bash
curl http://localhost:5000/api/chat/health
```

---

### 2. Client Setup

```bash
cd ../client

# Install dependencies
npm install

# Start Vite client
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Optional: Run Local AI with Ollama

If you do not want to use an external API key, start Ollama locally:
```bash
ollama serve
# Ensure qwen3.5:9b is pulled
ollama pull qwen3.5:9b
```
MineSmith will automatically detect and communicate with `http://localhost:11434`.

---

## ⚙️ Environment Variables

### Server Configuration (`server/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Backend server port | `5000` |
| `NODE_ENV` | Runtime environment (`development` / `production`) | `development` |
| `GROQ_API_KEY` | Groq Cloud API key for cloud LLM inference | Optional |
| `OLLAMA_HOST` | Host URL for local Ollama instance | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model tag for Ollama execution | `qwen3.5:9b` |
| `CLIENT_URL` | Allowed CORS frontend URL | `http://localhost:5173` |

### Client Configuration (`client/.env`)

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/chat` | Send a natural language prompt; returns parsed mods & rationale |
| `GET` | `/api/chat/history/:sessionId` | Retrieve chat session history |
| `GET` | `/api/chat/health` | Check AI provider statuses (Groq & Ollama) |
| `GET` | `/api/mods/:modId` | Get detailed metadata for a Modrinth mod |
| `GET` | `/api/mods/:modId/versions`| List available versions and file loaders for a mod |
| `POST` | `/api/packs/create` | Save a curated modpack and generate a shareable slug |
| `GET` | `/api/packs/:slug` | Retrieve a saved modpack by slug |
| `GET` | `/api/packs/:slug/download`| Stream a downloadable `.zip` of a saved pack |
| `POST` | `/api/packs/download-direct`| Direct-stream a `.zip` from a list of mod IDs |
| `GET` | `/api/versions` | List compatible Minecraft versions |
| `GET` | `/api/settings/providers` | View available AI provider priorities |

---

## 📝 License

This project is licensed under the MIT License.  
Minecraft is a trademark of Mojang Synergies AB. Mod assets are sourced via the [Modrinth API](https://modrinth.com).  
Crafted by [Utkarsh Yadav](https://github.com/utkarshIsAProgrammer).
