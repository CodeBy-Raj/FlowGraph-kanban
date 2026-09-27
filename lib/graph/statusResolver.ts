import { Task, Dependency, ComputedTask } from './types';
import { calculateSchedules, markCriticalPath } from './cpmEngine';

/**
 * Reconciles dynamic task statuses (READY vs BLOCKED) and dates across the dependency graph.
 */
export function reconcileGraph(
  tasks: Task[],
  dependencies: Dependency[],
  baselineDateStr: string = new Date().toISOString().split('T')[0]
): ComputedTask[] {
  const taskMap = new Map<string, Task>(tasks.map((t) => [t.id, t]));
  const predMap = new Map<string, string[]>();

  for (const t of tasks) {
    predMap.set(t.id, []);
  }

  for (const dep of dependencies) {
    if (taskMap.has(dep.predecessorId) && taskMap.has(dep.successorId)) {
      predMap.get(dep.successorId)!.push(dep.predecessorId);
    }
  }

  // Calculate schedules using CPM forward pass
  const scheduleMap = calculateSchedules(tasks, dependencies, baselineDateStr);

  // Compute Critical Path nodes
  const criticalIds = markCriticalPath(tasks, dependencies, scheduleMap);

  return tasks.map((task) => {
    const predecessors = predMap.get(task.id) || [];
    const blockingPredecessors: string[] = [];

    for (const predId of predecessors) {
      const predTask = taskMap.get(predId);
      // Prerequisite is satisfied only if predecessor is DONE
      if (predTask && predTask.columnStatus !== 'DONE') {
        blockingPredecessors.push(predId);
      }
    }

    const isBlocked = blockingPredecessors.length > 0;
    const dependencyStatus = isBlocked ? 'BLOCKED' : 'READY';
    const schedule = scheduleMap.get(task.id) || {
      earlyStart: 0,
      earlyFinish: task.durationDays,
      computedStartDate: task.startDate,
      computedEndDate: task.endDate,
    };

    return {
      ...task,
      startDate: schedule.computedStartDate,
      endDate: schedule.computedEndDate,
      earlyStart: schedule.earlyStart,
      earlyFinish: schedule.earlyFinish,
      dependencyStatus,
      isBlocked,
      blockingPredecessorIds: blockingPredecessors,
      isCritical: criticalIds.has(task.id),
    };
  });
}
