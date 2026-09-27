'use client';

import React, { useState, useEffect, useCallback } from 'react';
import KanbanBoard from '@/components/kanban/KanbanBoard';
import NewTaskForm from '@/components/kanban/NewTaskForm';
import DependencyManager from '@/components/dependencies/DependencyManager';
import AISuggestionModal from '@/components/ai/AISuggestionModal';
import { ComputedTask } from '@/lib/graph/types';
import { Toaster } from 'sonner';

export default function Home() {
  const [tasks, setTasks] = useState<ComputedTask[]>([]);

  const fetchGraph = useCallback(async () => {
    try {
      const res = await fetch('/api/tasks');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks);
      }
    } catch (e) {
      console.error('Failed to load board', e);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Top Navigation */}
      <header className="border-b bg-white px-8 py-4 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">TaskFlow Pro</h1>
          <p className="text-xs text-slate-500 font-medium">Deterministic DAG Scheduling & CPM Engine</p>
        </div>
        <div className="flex items-center gap-3">
          <AISuggestionModal tasks={tasks} onDependencyAdded={fetchGraph} />
        </div>
      </header>

      {/* Control Panels */}
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NewTaskForm onTaskCreated={fetchGraph} />
          <DependencyManager tasks={tasks} onDependencyAdded={fetchGraph} />
        </div>

        {/* Board Canvas */}
        <KanbanBoard tasks={tasks} fetchGraph={fetchGraph} />
      </div>

      <Toaster position="bottom-right" richColors />
    </main>
  );
}
