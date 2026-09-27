import { Dependency } from './types';

/**
 * Checks whether adding a directed dependency (predecessorId -> successorId)
 * would introduce a circular cycle into the existing graph.
 * 
 * An edge U -> V creates a cycle if and only if there is already a path from V to U.
 */
export function willCreateCycle(
  existingDependencies: Dependency[],
  newPredecessorId: string,
  newSuccessorId: string
): boolean {
  // A task cannot depend on itself
  if (newPredecessorId === newSuccessorId) {
    return true;
  }

  // Build adjacency list for existing edges: from -> [to, ...]
  const adj = new Map<string, string[]>();
  for (const dep of existingDependencies) {
    if (!adj.has(dep.predecessorId)) {
      adj.set(dep.predecessorId, []);
    }
    adj.get(dep.predecessorId)!.push(dep.successorId);
  }

  // Traverse downstream starting from newSuccessorId to see if we can reach newPredecessorId
  const visited = new Set<string>();
  const stack: string[] = [newSuccessorId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === newPredecessorId) {
      return true; // Cycle detected: path from successor to predecessor already exists
    }

    if (!visited.has(current)) {
      visited.add(current);
      const neighbors = adj.get(current) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

  return false;
}
