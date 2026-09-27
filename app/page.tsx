'use client';

import React, { useEffect, useState, useCallback } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import NewTaskForm from '@/components/kanban/NewTaskForm';
import DependencyManager from '@/components/dependencies/DependencyManager';
import { Toaster } from 'sonner';
import { ComputedTask } from '@/lib/graph/types';

export default function Home() {
  const [tasks, setTasks] = useState<ComputedTask[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (err) {
      console.error('Failed to fetch graph', err);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    fetchGraph();
  }, [fetchGraph]);

  if (!isMounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b bg-white px-6 py-4 flex justify-between items-center shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">TaskFlow Pro</h1>
          <p className="text-sm text-gray-500">Deterministic DAG Scheduling Engine</p>
        </div>
      </div>

      <div className="p-6 max-w-[1400px] mx-auto">
        <div className="flex flex-wrap gap-4 mb-2 items-start">
          <NewTaskForm onTaskCreated={fetchGraph} />
          <DependencyManager tasks={tasks} onDependencyAdded={fetchGraph} />
        </div>

        <KanbanBoard tasks={tasks} fetchGraph={fetchGraph} />
      </div>

      <Toaster position="bottom-right" richColors />
    </main>
  );
}
