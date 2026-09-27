'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

export default function NewTaskForm({ onTaskCreated }: { onTaskCreated: () => void }) {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, durationDays: duration, columnStatus: 'BACKLOG' }),
      });
      
      if (!res.ok) throw new Error('Failed to create task');
      
      toast.success('Task created successfully');
      setTitle('');
      setDuration(1);
      onTaskCreated(); // Trigger parent to re-fetch the graph
    } catch (error) {
      toast.error('Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm w-full max-w-2xl">
      <input 
        type="text" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="New task title..." 
        className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
        required
      />
      <input 
        type="number" 
        min="1"
        value={duration} 
        onChange={(e) => setDuration(Number(e.target.value))} 
        className="w-20 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-900"
        title="Duration in days"
      />
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
      >
        <Plus size={16} /> Add Task
      </button>
    </form>
  );
}
