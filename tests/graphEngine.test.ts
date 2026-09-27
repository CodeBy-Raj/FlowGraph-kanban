import { describe, it, expect } from 'vitest';
import { willCreateCycle } from '../lib/graph/cycleDetector';
import { calculateSchedules } from '../lib/graph/cpmEngine';
import { reconcileGraph } from '../lib/graph/statusResolver';
import { Task, Dependency } from '../lib/graph/types';

describe('TaskFlow Pro Graph Engine', () => {
  // Test 1: Cycle Detection
  it('correctly rejects circular dependencies (A -> B -> C -> A)', () => {
    const edges: Dependency[] = [
      { predecessorId: 'A', successorId: 'B' },
      { predecessorId: 'B', successorId: 'C' },
    ];

    // Adding C -> A would form A -> B -> C -> A
    const isCycle = willCreateCycle(edges, 'C', 'A');
    expect(isCycle).toBe(true);

    // Self-loop check (A -> A)
    expect(willCreateCycle(edges, 'A', 'A')).toBe(true);

    // Valid non-cyclic edge (A -> C)
    expect(willCreateCycle(edges, 'A', 'C')).toBe(false);
  });

  // Test 2: Diamond Dependency Non-Compounding Delays
  it('prevents compounding delays across converging diamond paths (A -> B, C -> D)', () => {
    const baselineDate = '2026-06-01';

    // Baseline graph where Task A duration is 2 days
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
    // Initial Early Start for D: A(2) + B(3) = 5 days offset
    expect(initialSchedule.get('D')!.earlyStart).toBe(5);

    // Now Task A is extended by +3 days (from 2 to 5 days)
    const delayedTasks: Task[] = baseTasks.map((t) =>
      t.id === 'A' ? { ...t, durationDays: 5 } : t
    );

    const delayedSchedule = calculateSchedules(delayedTasks, dependencies, baselineDate);
    // Task D earlyStart must shift by exactly +3 days (5 -> 8), NOT +6 days
    expect(delayedSchedule.get('D')!.earlyStart).toBe(8);
  });

  // Test 3: Downstream Rollback on Regression
  it('cascades BLOCKED status to downstream tasks when upstream task regresses to IN_PROGRESS', () => {
    const tasks: Task[] = [
      { id: 'A', title: 'Task A', columnStatus: 'DONE', durationDays: 2, startDate: '2026-06-01', endDate: '2026-06-03' },
      { id: 'B', title: 'Task B', columnStatus: 'BACKLOG', durationDays: 2, startDate: '2026-06-03', endDate: '2026-06-05' },
    ];
    const deps: Dependency[] = [{ predecessorId: 'A', successorId: 'B' }];

    // Initially, A is DONE, so B should be READY
    let computed = reconcileGraph(tasks, deps);
    const taskBWhenAReady = computed.find((t) => t.id === 'B')!;
    expect(taskBWhenAReady.dependencyStatus).toBe('READY');
    expect(taskBWhenAReady.isBlocked).toBe(false);

    // Task A regresses from DONE back to IN_PROGRESS
    const regressedTasks: Task[] = tasks.map((t) =>
      t.id === 'A' ? { ...t, columnStatus: 'IN_PROGRESS' } : t
    );

    computed = reconcileGraph(regressedTasks, deps);
    const taskBAfterRegression = computed.find((t) => t.id === 'B')!;
    expect(taskBAfterRegression.dependencyStatus).toBe('BLOCKED');
    expect(taskBAfterRegression.isBlocked).toBe(true);
    expect(taskBAfterRegression.blockingPredecessorIds).toContain('A');
  });
});
