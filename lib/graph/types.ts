export type ColumnStatus = 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type DependencyStatus = 'READY' | 'BLOCKED';

export interface Task {
  id: string;
  title: string;
  description?: string;
  columnStatus: ColumnStatus;
  durationDays: number;
  startDate: string; // ISO date string 'YYYY-MM-DD'
  endDate: string;   // ISO date string 'YYYY-MM-DD'
}

export interface Dependency {
  id?: string;
  predecessorId: string; // Prerequisite task (must finish first)
  successorId: string;   // Dependent task (cannot start until predecessor finishes)
}

export interface ComputedTask extends Task {
  dependencyStatus: DependencyStatus;
  isBlocked: boolean;
  blockingPredecessorIds: string[];
  earlyStart: number;  // Offset in days relative to baseline
  earlyFinish: number; // Offset in days relative to baseline
  isCritical?: boolean;
}
