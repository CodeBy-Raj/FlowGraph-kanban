import { Task, Dependency } from './types';

function addDaysToDateString(baseDateStr: string, days: number): string {
  const d = new Date(baseDateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Executes a topological sort and CPM forward pass.
 * Calculates earlyStart, earlyFinish, updated start/end dates, and identifies critical path nodes.
 */
export function calculateSchedules(
  tasks: Task[],
  dependencies: Dependency[],
  projectBaselineDateStr: string
): Map<string, { earlyStart: number; earlyFinish: number; computedStartDate: string; computedEndDate: string }> {
  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();
  const predMap = new Map<string, string[]>();

  for (const task of tasks) {
    inDegree.set(task.id, 0);
    adj.set(task.id, []);
    predMap.set(task.id, []);
  }

  for (const dep of dependencies) {
    if (taskMap.has(dep.predecessorId) && taskMap.has(dep.successorId)) {
      adj.get(dep.predecessorId)!.push(dep.successorId);
      predMap.get(dep.successorId)!.push(dep.predecessorId);
      inDegree.set(dep.successorId, (inDegree.get(dep.successorId) || 0) + 1);
    }
  }

  // Kahn's topological sort
  const queue: string[] = [];
  for (const [id, deg] of inDegree.entries()) {
    if (deg === 0) {
      queue.push(id);
    }
  }

  const topologicalOrder: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    topologicalOrder.push(u);
    for (const v of adj.get(u) || []) {
      const newDeg = inDegree.get(v)! - 1;
      inDegree.set(v, newDeg);
      if (newDeg === 0) {
        queue.push(v);
      }
    }
  }

  const scheduleMap = new Map<
    string,
    { earlyStart: number; earlyFinish: number; computedStartDate: string; computedEndDate: string }
  >();

  // Forward Pass: compute earlyStart and earlyFinish
  for (const taskId of topologicalOrder) {
    const task = taskMap.get(taskId)!;
    const preds = predMap.get(taskId) || [];

    let earlyStart = 0;
    if (preds.length > 0) {
      // Deterministic max() synchronization barrier prevents delay compounding across parallel branches
      for (const predId of preds) {
        const predSchedule = scheduleMap.get(predId);
        if (predSchedule && predSchedule.earlyFinish > earlyStart) {
          earlyStart = predSchedule.earlyFinish;
        }
      }
    }

    const earlyFinish = earlyStart + Math.max(task.durationDays, 1);
    const computedStartDate = addDaysToDateString(projectBaselineDateStr, earlyStart);
    const computedEndDate = addDaysToDateString(projectBaselineDateStr, earlyFinish);

    scheduleMap.set(taskId, {
      earlyStart,
      earlyFinish,
      computedStartDate,
      computedEndDate,
    });
  }

  return scheduleMap;
}
