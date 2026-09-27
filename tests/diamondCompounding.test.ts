import { describe, it, expect } from 'vitest';
import { calculateSchedules } from '../lib/graph/cpmEngine';
import { Task, Dependency } from '../lib/graph/types';

describe('Diamond Dependency Compounding', () => {
  it('prevents compounding delays across converging diamond paths (A -> B, C -> D)', () => {
    const baselineDate = '2026-06-01';
    const baseTasks: Task[] = [
      { id: 'A', title: 'Task A', columnStatus: 'BACKLOG', durationDays: 2, startDate: baselineDate, endDate: '' },
      { id: 'B', title: 'Task B', columnStatus: 'BACKLOG', durationDays: 3, startDate: '', endDate: '' },
      { id: 'C', title: 'Task C', columnStatus: 'BACKLOG', durationDays: 3, startDate: '', endDate: '' },
      { id: 'D', title: 'Task D', columnStatus: 'BACKLOG', durationDays: 1, startDate: '', endDate: '' },
    ];

    const dependencies: Dependency[] = [
      { predecessorId: 'A', successorId: 'B' },
      { predecessorId: 'A', successorId: 'C' },
      { predecessorId: 'B', successorId: 'D' },
      { predecessorId: 'C', successorId: 'D' },
    ];

    const initialSchedule = calculateSchedules(baseTasks, dependencies, baselineDate);
    expect(initialSchedule.get('D')!.earlyStart).toBe(5);

    const delayedTasks: Task[] = baseTasks.map((t) =>
      t.id === 'A' ? { ...t, durationDays: 5 } : t
    );

    const delayedSchedule = calculateSchedules(delayedTasks, dependencies, baselineDate);
    expect(delayedSchedule.get('D')!.earlyStart).toBe(8);
  });
});
