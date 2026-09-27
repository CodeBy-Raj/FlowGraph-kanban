'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ComputedTask } from '@/lib/graph/types';
import { Link } from 'lucide-react';

export default function DependencyManager({ tasks, onDependencyAdded }: { tasks: ComputedTask[], onDependencyAdded: () => void }) {
  const [predecessorId, setPredecessorId] = useState('');
  const [successorId, setSuccessorId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddDependency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!predecessorId || !successorId) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ predecessorId, successorId }),
      });

      const data = await res.json();

      if (!res.ok) {
        // This catches the DFS Cycle Detection error from the API
        toast.error(data.error || 'Failed to add dependency', { duration: 5000 });
        return;
      }

      toast.success('Dependency linked successfully');
      setPredecessorId('');
      setSuccessorId('');
      onDependencyAdded(); // Re-fetch graph to update block/ready states
    } catch (error) {
      toast.error('Network error while adding dependency');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleAddDependency} className="flex gap-2 items-center mb-6 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full max-w-3xl">
      <div className="text-sm font-medium text-gray-700 flex items-center gap-2 mr-2">
        <Link size={16} /> Link Tasks:
      </div>
      <select 
        value={predecessorId} 
        onChange={(e) => setPredecessorId(e.target.value)}
        className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white"
        required
      >
        <option value="">Select Prerequisite (Blocks...)</option>
        {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <span className="text-gray-400">→</span>
      <select 
        value={successorId} 
        onChange={(e) => setSuccessorId(e.target.value)}
        className="flex-1 px-3 py-2 border rounded-lg text-sm text-gray-900 bg-white"
        required
      >
        <option value="">Select Successor (Is Blocked By...)</option>
        {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
      </select>
      <button 
        type="submit" 
        disabled={isSubmitting || predecessorId === successorId}
        className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
      >
        Create Link
      </button>
    </form>
  );
}
