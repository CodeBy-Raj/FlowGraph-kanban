-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
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

-- Directed Dependencies table (Predecessor -> Successor)
CREATE TABLE IF NOT EXISTS task_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_no_self CHECK (predecessor_id <> successor_id),
  CONSTRAINT uq_dep UNIQUE (predecessor_id, successor_id)
);

-- Performance indexes for graph queries and topological checks
CREATE INDEX IF NOT EXISTS idx_deps_predecessor ON task_dependencies(predecessor_id);
CREATE INDEX IF NOT EXISTS idx_deps_successor ON task_dependencies(successor_id);
CREATE INDEX IF NOT EXISTS idx_deps_pair ON task_dependencies(predecessor_id, successor_id);
