import { sql } from './neon';
import { Task, Dependency, ColumnStatus } from '../graph/types';

export interface TaskRow {
  id: string;
  title: string;
  description: string;
  column_status: ColumnStatus;
  duration_days: number;
  start_date: string;
  end_date: string;
  created_at?: string;
  updated_at?: string;
}

export interface DependencyRow {
  id: string;
  predecessor_id: string;
  successor_id: string;
}

function mapTaskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    columnStatus: row.column_status,
    durationDays: Number(row.duration_days),
    startDate: typeof row.start_date === 'string' ? row.start_date.split('T')[0] : new Date(row.start_date).toISOString().split('T')[0],
    endDate: typeof row.end_date === 'string' ? row.end_date.split('T')[0] : new Date(row.end_date).toISOString().split('T')[0],
  };
}

export async function getAllTasksAndDependencies(): Promise<{ tasks: Task[]; dependencies: Dependency[] }> {
  const [taskRows, depRows] = await Promise.all([
    sql`SELECT id, title, description, column_status, duration_days, start_date::text, end_date::text FROM tasks ORDER BY created_at ASC;` as unknown as Promise<TaskRow[]>,
    sql`SELECT id, predecessor_id, successor_id FROM task_dependencies;` as unknown as Promise<DependencyRow[]>,
  ]);

  const tasks: Task[] = taskRows.map(mapTaskRowToTask);
  const dependencies: Dependency[] = depRows.map((r) => ({
    id: r.id,
    predecessorId: r.predecessor_id,
    successorId: r.successor_id,
  }));

  return { tasks, dependencies };
}

export async function insertTask(params: {
  title: string;
  description?: string;
  columnStatus?: ColumnStatus;
  durationDays?: number;
  startDate?: string;
}): Promise<Task> {
  const title = params.title;
  const description = params.description || '';
  const columnStatus = params.columnStatus || 'BACKLOG';
  const duration = params.durationDays && params.durationDays > 0 ? params.durationDays : 1;
  const startDate = params.startDate || new Date().toISOString().split('T')[0];

  const rows = await sql`
    INSERT INTO tasks (title, description, column_status, duration_days, start_date, end_date)
    VALUES (
      ${title},
      ${description},
      ${columnStatus},
      ${duration},
      ${startDate}::date,
      (${startDate}::date + (${duration} * INTERVAL '1 day'))::date
    )
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  ` as unknown as TaskRow[];

  return mapTaskRowToTask(rows[0]);
}

export async function updateTask(
  id: string,
  updates: {
    title?: string;
    description?: string;
    columnStatus?: ColumnStatus;
    durationDays?: number;
    startDate?: string;
    endDate?: string;
  }
): Promise<Task | null> {
  const currentRows = await sql`SELECT * FROM tasks WHERE id = ${id}::uuid;` as unknown as TaskRow[];
  if (currentRows.length === 0) return null;

  const current = currentRows[0];
  const title = updates.title ?? current.title;
  const description = updates.description ?? current.description;
  const columnStatus = updates.columnStatus ?? current.column_status;
  const durationDays = updates.durationDays ?? current.duration_days;
  const startDate = updates.startDate ?? current.start_date;
  const endDate = updates.endDate ?? current.end_date;

  const updatedRows = await sql`
    UPDATE tasks
    SET
      title = ${title},
      description = ${description},
      column_status = ${columnStatus},
      duration_days = ${durationDays},
      start_date = ${startDate}::date,
      end_date = ${endDate}::date,
      updated_at = NOW()
    WHERE id = ${id}::uuid
    RETURNING id, title, description, column_status, duration_days, start_date::text, end_date::text;
  ` as unknown as TaskRow[];

  return mapTaskRowToTask(updatedRows[0]);
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM tasks WHERE id = ${id}::uuid RETURNING id;`;
  return result.length > 0;
}

export async function insertDependency(predecessorId: string, successorId: string): Promise<Dependency> {
  const rows = await sql`
    INSERT INTO task_dependencies (predecessor_id, successor_id)
    VALUES (${predecessorId}::uuid, ${successorId}::uuid)
    RETURNING id, predecessor_id, successor_id;
  ` as unknown as DependencyRow[];

  return {
    id: rows[0].id,
    predecessorId: rows[0].predecessor_id,
    successorId: rows[0].successor_id,
  };
}

export async function deleteDependency(predecessorId: string, successorId: string): Promise<boolean> {
  const result = await sql`
    DELETE FROM task_dependencies
    WHERE predecessor_id = ${predecessorId}::uuid AND successor_id = ${successorId}::uuid
    RETURNING id;
  `;
  return result.length > 0;
}
