'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { ComputedTask } from '@/lib/graph/types';
import { Sparkles, Check, X, Loader2 } from 'lucide-react';

interface Suggestion {
  predecessorId: string;
  successorId: string;
  reason: string;
}

export default function AISuggestionModal({ tasks, onDependencyAdded }: { tasks: ComputedTask[], onDependencyAdded: () => void }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getTaskTitle = (id: string) => tasks.find(t => t.id === id)?.title || 'Unknown Task';

  const handleSuggest = async () => {
    setIsGenerating(true);
    setIsOpen(true);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks }),
      });
      const data = await res.json();
      
      // Filter out suggestions where predecessor === successor
      const validSuggestions = (data.suggestions || []).filter((s: Suggestion) => s.predecessorId !== s.successorId);
      setSuggestions(validSuggestions);
      if (validSuggestions.length === 0) toast.info('No logical dependencies found.');
    } catch (error) {
      toast.error('Failed to generate AI suggestions');
      setIsOpen(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = async (suggestion: Suggestion, index: number) => {
    try {
      const res = await fetch('/api/dependencies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          predecessorId: suggestion.predecessorId, 
          successorId: suggestion.successorId 
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Deterministic guardrail catches LLM hallucinations (cycles)
        toast.error(`Rejected: ${data.error}`);
        return;
      }

      toast.success('Dependency added successfully');
      setSuggestions(current => current.filter((_, i) => i !== index));
      onDependencyAdded();
    } catch (error) {
      toast.error('Network error while adding dependency');
    }
  };

  return (
    <>
      <button 
        onClick={handleSuggest}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
      >
        <Sparkles size={16} /> Auto-Suggest Links
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
              <h3 className="font-semibold flex items-center gap-2 text-indigo-900">
                <Sparkles size={18} className="text-indigo-600" /> AI Dependency Suggestions
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 size={32} className="animate-spin mb-4 text-indigo-600" />
                  <p>Analyzing task topology...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No pending suggestions.</p>
              ) : (
                <div className="space-y-3">
                  {suggestions.map((s, idx) => (
                    <div key={idx} className="border rounded-lg p-3 flex items-center justify-between bg-white shadow-sm">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 mb-1">
                          <span className="truncate max-w-[200px]">{getTaskTitle(s.predecessorId)}</span>
                          <span className="text-gray-400">→ blocks →</span>
                          <span className="truncate max-w-[200px]">{getTaskTitle(s.successorId)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{s.reason}</p>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => handleAccept(s, idx)}
                          className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md"
                          title="Accept"
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => setSuggestions(current => current.filter((_, i) => i !== idx))}
                          className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-md"
                          title="Reject"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
