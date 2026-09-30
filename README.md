# 🖥️ Velo Frontend

The client-side web application for the **Velo** Cloud Development Environment. Built with **Next.js 16**, **React 19**, **Tailwind CSS v4**, and **TypeScript**.

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: `v20.x` or higher
- **Package Manager**: `npm` (or `pnpm`)

---

### Installation & Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd velo-frontend
   ```

2. **Set up your local environment file:**
   Copy the provided `.env.example` template:
   ```bash
   cp .env.example .env.local
   ```
   *By default, `NEXT_PUBLIC_API_URL` points to `http://localhost:8080/api`.*

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Runs the Next.js development server with Turbopack |
| `npm run build` | Compiles and builds the production application |
| `npm run start` | Starts the Next.js production server |
| `npx tsc --noEmit` | Runs the TypeScript compiler to verify type safety |

---

## 🧩 Key Architecture

- **`app/`**: Next.js App Router containing Authentication routes (`/login`, `/register`, `/forgot-password`), Dashboard, and IDE Workspace (`/project/[id]`).
- **`components/ide/`**:
  - **`IdeEditorArea.tsx`**: Monaco Editor instance with auto-save, cursor/selection tracking, and tab navigation.
  - **`IdeTerminalArea.tsx`**: xterm.js terminal viewport with fit addon and ANSI color support.
  - **`IdeAgentPanel.tsx`**: AI Agent control center with step progress indicators and diff reviewer.
  - **`agent/AgentDiffViewer.tsx`**: Hunk-level diff visualization with interactive Accept/Reject toggles.
  - **`agent/AgentProgressPanel.tsx`**: Real-time agent thought & execution phase stepper.
- **`hooks/`**:
  - **`useAgentSse.ts`**: Server-Sent Events hook managing streaming step updates, proposal sync, and auto-reconnection.
  - **`useTerminalWebSocket.ts`**: WebSocket manager connecting xterm.js to the backend PTY shell.
- **`store/`**:
  - **`agentStore.ts`**: Zustand store managing agent run lifecycle, proposals, and optimistic hunk decisions.
  - **`authStore.ts`**: Zustand store for user session and authentication status.
- **`services/`**:
  - **`api.ts`**: Axios instance with automatic response unwrapping and JWT refresh retry interceptor.
  - **`agentService.ts`**: REST client for all agent runs, tools, proposals, and safe-apply endpoints.
