import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL is not set in environment or .env.local');
  process.exit(1);
}

const sql = neon(databaseUrl);

async function initializeAndSeed() {
  console.log('Connecting to Neon PostgreSQL...');

  // 1. Create tables and constraints
  console.log('Applying database schema...');
  await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`;

  await sql`
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS task_dependencies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      predecessor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      successor_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      CONSTRAINT chk_no_self CHECK (predecessor_id <> successor_id),
      CONSTRAINT uq_dep UNIQUE (predecessor_id, successor_id)
    );
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_deps_predecessor ON task_dependencies(predecessor_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_deps_successor ON task_dependencies(successor_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_deps_pair ON task_dependencies(predecessor_id, successor_id);`;

  console.log('Tables initialized successfully.');

  // 2. Check if database already has tasks
  const existing = await sql`SELECT COUNT(*)::int as count FROM tasks;`;
  if (existing[0].count > 0) {
    console.log(`Database already has ${existing[0].count} tasks. Skipping initial seed.`);
    process.exit(0);
  }

  // 3. Seed Canonical Diamond Dependency Graph & Sample Tasks
  console.log('Seeding initial canonical tasks and diamond dependency structure...');
  const today = new Date().toISOString().split('T')[0];

  const [taskA] = await sql`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES ('Task A: Database Schema Design', 'Core PostgreSQL schemas, migrations, and DDL constraints', 'DONE', 2, ${today}::date, (${today}::date + INTERVAL '2 days')::date)
    RETURNING id;
  `;

  const [taskB] = await sql`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES ('Task B: REST API Endpoints', 'Express / Next.js route handlers for task CRUD', 'IN_PROGRESS', 3, (${today}::date + INTERVAL '2 days')::date, (${today}::date + INTERVAL '5 days')::date)
    RETURNING id;
  `;

  const [taskC] = await sql`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES ('Task C: WebSocket Real-Time Sync', 'Real-time state broadcast and client reconnection logic', 'BACKLOG', 2, (${today}::date + INTERVAL '2 days')::date, (${today}::date + INTERVAL '4 days')::date)
    RETURNING id;
  `;

  const [taskD] = await sql`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES ('Task D: End-to-End Integration Suite', 'Converging test suite verifying API, DB, and WebSockets', 'BACKLOG', 2, (${today}::date + INTERVAL '5 days')::date, (${today}::date + INTERVAL '7 days')::date)
    RETURNING id;
  `;

  // Seed Diamond Dependency: A -> B, A -> C, B -> D, C -> D
  await sql`INSERT INTO task_dependencies (predecessor_id, successor_id) VALUES (${taskA.id}::uuid, ${taskB.id}::uuid);`;
  await sql`INSERT INTO task_dependencies (predecessor_id, successor_id) VALUES (${taskA.id}::uuid, ${taskC.id}::uuid);`;
  await sql`INSERT INTO task_dependencies (predecessor_id, successor_id) VALUES (${taskB.id}::uuid, ${taskD.id}::uuid);`;
  await sql`INSERT INTO task_dependencies (predecessor_id, successor_id) VALUES (${taskC.id}::uuid, ${taskD.id}::uuid);`;

  console.log('Canonical Diamond Dependency Seed complete:');
  console.log(`- Task A (${taskA.id}) -> [DONE]`);
  console.log(`- Task B (${taskB.id}) -> depends on A`);
  console.log(`- Task C (${taskC.id}) -> depends on A`);
  console.log(`- Task D (${taskD.id}) -> depends on B and C (Diamond Convergence)`);
}

initializeAndSeed()
  .then(() => {
    console.log('Phase 2 setup completed successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Initialization failed:', err);
    process.exit(1);
  });
