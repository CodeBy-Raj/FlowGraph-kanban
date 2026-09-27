import { describe, it, expect } from 'vitest';
import { willCreateCycle } from '../lib/graph/cycleDetector';
import { Dependency } from '../lib/graph/types';

describe('AI Suggestion Deterministic Guardrail', () => {
  it('rejects an AI-proposed dependency that introduces a cycle', () => {
    // Existing valid dependency chain: Task A -> Task B
    const existingDependencies: Dependency[] = [
      { predecessorId: 'task-A', successorId: 'task-B' }
    ];

    // Simulated LLM hallucination: suggesting Task B -> Task A
    const hallucinatedEdge = { predecessorId: 'task-B', successorId: 'task-A' };

    const createsCycle = willCreateCycle(
      existingDependencies,
      hallucinatedEdge.predecessorId,
      hallucinatedEdge.successorId
    );

    // Assert that the deterministic engine blocks the hallucination
    expect(createsCycle).toBe(true);
  });
});
