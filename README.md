# TaskFlow Pro: Dependency-Aware Workflow & DAG Scheduling Engine

TaskFlow Pro is a production-grade workflow platform combining a modern, interactive Kanban board with an autonomous Directed Acyclic Graph (DAG) scheduling engine. It replaces naive linear boards by actively modeling complex downstream dependencies, preventing circular dependency deadlocks, dynamically recalculating CPM schedules, and cascading state regressions in real time.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (React + Tailwind CSS)                 │
│  - Interactive Kanban (Backlog, In Progress, Review, Done)                 │
│  - Dynamic Ready/Blocked Badging & Critical Path Highlighting               │
│  - Human-in-the-Loop (HITL) AI Dependency Suggestion Queue                  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ REST API (JSON)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Next.js Route Handlers (/app/api/*)                     │
│  - GET /api/tasks: Fetches graph topologically resolved via statusResolver │
│  - PATCH /api/tasks/[id]: Updates status with regression rollback cascade   │
│  - POST /api/dependencies: Enforces O(V+E) DFS cycle check before writing   │
│  - POST /api/ai/suggest: Gemini 2.5 Flash Structured Output suggestions     │
└──────────────────┬──────────────────────────────────────────┬───────────────┘
                   │                                          │
                   ▼                                          ▼
┌─────────────────────────────────────────┐   ┌───────────────────────────────┐
│       Core Graph Engine (lib/graph/)    │   │    Neon PostgreSQL Database   │
│  - DFS Cycle Detection (Pre-commit)     │   │  - tasks (UUID, status, dates)│
│  - CPM Forward/Backward Pass (Float)    │◄──┤  - task_dependencies (Edges)  │
│  - Dynamic Status & Cascading Rollback  │   │  - Self-loop & unique checks  │
│  - Zero-Float Critical Path Extraction  │   │  - ON DELETE CASCADE triggers │
└─────────────────────────────────────────┘   └───────────────────────────────┘
```

### Core Data Flow

1. **Edge Verification & Cycle Guardrail**: When a user links Task $U \to V$, the API invokes `willCreateCycle(existingEdges, U, V)`. A Depth-First Search (DFS) verifies if $U$ is reachable from $V$ ($V \rightsquigarrow U$). If reachable, the edge is rejected with `400 Bad Request`, safeguarding graph acyclicity prior to database persistence.
2. **CPM Forward Pass & Diamond Non-Compounding**: Delays propagating through parallel converging paths ($A \to B \to D$ and $A \to C \to D$) are resolved using a deterministic synchronization barrier:

$$\text{Early Start}(D) = \max(\text{Early Finish}(B), \text{Early Finish}(C))$$

Overlapping delay is absorbed by topological float, preventing double-counting schedule shifts.
3. **Upstream Regression Rollback**: When a task moves backward from `DONE` to `IN_PROGRESS`, `reconcileGraph()` dynamically invalidates downstream readiness, flipping dependent tasks from `READY` to `BLOCKED`.
4. **AI Suggestion & Guardrails**: Gemini 2.5 Flash generates suggested prerequisite pairs via strict JSON Schema. Suggestions are staged in a Human-in-the-Loop review queue; accepted pairs must pass the deterministic cycle detector before writing to PostgreSQL.

---

## 2. Database Schema & Data Models

### Relational Schema (PostgreSQL / Neon DDL)

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  column_status VARCHAR(20) NOT NULL DEFAULT 'BACKLOG',
  duration_days INT NOT NULL DEFAULT 1,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE NOT NULL DEFAULT CURRENT_DATE + INTERVAL '1 day',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_duration_positive CHECK (duration_days >= 1),
  CONSTRAINT chk_valid_column CHECK (column_status IN ('BACKLOG', 'IN_PROGRESS', 'REVIEW', 'DONE'))
);

CREATE TABLE task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_no_self CHECK (predecessor_id <> successor_id),
  CONSTRAINT uq_dep UNIQUE (predecessor_id, successor_id)
);

CREATE INDEX idx_deps_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX idx_deps_successor ON task_dependencies(successor_id);
CREATE INDEX idx_deps_pair ON task_dependencies(predecessor_id, successor_id);
```

### In-Memory Graph Model (`lib/graph/types.ts`)

```typescript
export type ColumnStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type DependencyStatus = 'READY' | 'BLOCKED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnStatus: ColumnStatus;
  durationDays: number;
  startDate: string;
  endDate: string;
}

export interface Dependency {
  id?: string;
  predecessorId: string;
  successorId: string;
}

export interface ComputedTask extends Task {
  dependencyStatus: DependencyStatus;
  isBlocked: boolean;
  blockingPredecessorIds: string[];
  earlyStart: number;
  earlyFinish: number;
  isCritical?: boolean;
}
```

---

## 3. Algorithmic Implementations

* **Cycle Detection (`lib/graph/cycleDetector.ts`)**: Runs an $O(V + E)$ Depth-First Search with recursion stack tracking. Any attempted edge closing an existing directed path is intercepted and aborted.
* **Topological Sort & CPM Forward Pass (`lib/graph/cpmEngine.ts`)**: Implements Kahn's Algorithm to establish topological order, followed by an algebraic $\max()$ forward pass to compute `earlyStart` and `earlyFinish` across parallel branches.
* **Critical Path Extraction**: Identifies the terminal tasks matching maximum duration and performs a backward trace across zero-float nodes ($\text{Total Float} = \text{Late Start} - \text{Early Start} = 0$), dynamically badging critical nodes.
* **Dynamic Status Resolution (`lib/graph/statusResolver.ts`)**: Evaluates direct prerequisites: a node is marked `READY` only if all predecessors are `DONE`.

---

## 4. Responsible AI Usage & Neuro-Symbolic Guardrails

* **Model & Structured Output**: Uses **Gemini 2.5 Flash** configured with `responseMimeType: "application/json"` and strict `responseSchema` (Zod/JSON Schema).
* **Deterministic Guardrails**: LLMs are probabilistic and prone to hallucinating cycles or self-referential links. AI suggestions are strictly isolated in a Human-in-the-Loop (HITL) review modal.
* **Zero-Trust Persistence**: When a user clicks "Accept" on an AI-suggested edge, the request is piped directly to the deterministic `willCreateCycle()` validator. Any cyclic suggestion is rejected at the API boundary, guaranteeing that the graph never relies on model outputs for topological correctness.
* **Disclosed Build Tools**: Claude Code and GitHub Copilot were used during development for scaffolding test fixtures and typing database responses.

---

## 5. Known Limitations (v1 Scope)

1. **Intra-Project Scope**: Dependencies operate strictly within a single project board. Cross-board or cross-workspace dependencies are deferred beyond v1.
2. **Finish-to-Start (FS) Only**: The scheduling engine enforces strict Finish-to-Start precedence (Task A must reach `DONE` before Task B can become `READY`). Start-to-Start (SS), Finish-to-Finish (FF), and lead/lag day offsets are excluded from v1.
3. **Graph Density Ceiling**: In-memory DFS and CPM recomputations run synchronously on API request cycles, supporting up to 1,000 tasks and 3,000 dependencies per board without sub-graph partitioning.

---

## 6. Local Setup and Execution

### Prerequisites

* Node.js >= 18.x
* A Neon PostgreSQL connection string (or local PostgreSQL instance)
* A Google Gemini API Key

### Installation Steps

1. Clone the repository:
```bash
git clone <REPO_URL>
cd taskflow-pro
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Add your credentials in `.env.local`:
```env
DATABASE_URL=postgresql://user:password@ep-host.region.neon.tech/neondb?sslmode=require
GEMINI_API_KEY=your_gemini_api_key_here
```

4. Run database initialization and canonical seed:
```bash
npm run db:init
```

5. Start development server:
```bash
npm run dev
```

Open `http://localhost:3000` to interact with TaskFlow Pro.

---

## 7. Testing & Verification

Run the automated test suite:

```bash
npm test
```
