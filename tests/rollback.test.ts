import { describe, it, expect } from 'vitest';
import { reconcileGraph } from '../lib/graph/statusResolver';
import { Task, Dependency } from '../lib/graph/types';

describe('Regression Rollback', () => {
  it('cascades BLOCKED status to downstream tasks when upstream task regresses to IN_PROGRESS', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'Task A', columnStatus: 'DONE', durationDays: 2, startDate: '2026-06-01', endDate: '2026-06-03' },
      { id: 'B', title: 'Task B', columnStatus: 'BACKLOG', durationDays: 2, startDate: '2026-06-03', endDate: '2026-06-05' },
    ];
    const deps: Dependency[] = [{ predecessorId: 'A', successorId: 'B' }];

    let computed = reconcileGraph(tasks, deps);
    const taskBWhenAReady = computed.find((t) => t.id === 'B')!;
    expect(taskBWhenAReady.dependencyStatus).toBe('READY');

    const regressedTasks: Task[] = tasks.map((t) =>
      t.id === 'A' ? { ...t, columnStatus: 'IN_PROGRESS' } : t
    );

    computed = reconcileGraph(regressedTasks, deps);
    const taskBAfterRegression = computed.find((t) => t.id === 'B')!;
    expect(taskBAfterRegression.dependencyStatus).toBe('BLOCKED');
    expect(taskBAfterRegression.isBlocked).toBe(true);
  });
});
