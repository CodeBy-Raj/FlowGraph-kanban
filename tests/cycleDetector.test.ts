import { describe, it, expect } from 'vitest';
import { willCreateCycle } from '../lib/graph/cycleDetector';
import { Dependency } from '../lib/graph/types';

describe('Cycle Detector', () => {
  it('correctly rejects circular dependencies (A -> B -> C -> A)', () => {
    const edges: Dependency[] = [
      { predecessorId: 'A', successorId: 'B' },
      { predecessorId: 'B', successorId: 'C' },
    ];

    expect(willCreateCycle(edges, 'C', 'A')).toBe(true);
    expect(willCreateCycle(edges, 'A', 'A')).toBe(true);
    expect(willCreateCycle(edges, 'A', 'C')).toBe(false);
  });
});
