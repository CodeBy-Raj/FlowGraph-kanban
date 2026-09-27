import { describe, it, expect } from 'vitest';
import { calculateSchedules } from '../lib/graph/cpmEngine';
import { Task, Dependency } from '../lib/graph/types';

describe('CPM Engine', () => {
  it('calculates early start and finish dates correctly in topological order', () => {
    const baselineDate = '2026-06-01';
    const tasks: Task[] = [
      { id: 'A', title: 'Task A', columnStatus: 'BACKLOG', durationDays: 3, startDate: '', endDate: '' },
      { id: 'B', title: 'Task B', columnStatus: 'BACKLOG', durationDays: 2, startDate: '', endDate: '' },
    ];
    const deps: Dependency[] = [{ predecessorId: 'A', successorId: 'B' }];

    const schedules = calculateSchedules(tasks, deps, baselineDate);
    expect(schedules.get('A')!.earlyStart).toBe(0);
    expect(schedules.get('A')!.earlyFinish).toBe(3);
    expect(schedules.get('B')!.earlyStart).toBe(3);
    expect(schedules.get('B')!.earlyFinish).toBe(5);
  });
});
