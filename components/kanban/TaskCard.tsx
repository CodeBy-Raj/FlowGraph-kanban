import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ComputedTask } from '@/lib/graph/types';

export default function TaskCard({ task, index }: { task: ComputedTask; index: number }) {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 mb-3 bg-white rounded-lg border shadow-sm transition-shadow ${
            snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-500' : 'hover:shadow-md'
          } ${task.isBlocked ? 'border-red-200' : 'border-gray-200'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900 text-sm">{task.title}</h4>
          </div>
          
          {/* Dynamic Dependency Status Pill */}
          <div className="mb-3">
            {task.isBlocked ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded-md ring-1 ring-inset ring-red-600/10">
                <AlertCircle size={12} />
                Blocked ({task.blockingPredecessorIds.length} pending)
              </span>
            ) : task.columnStatus === 'DONE' ? (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md ring-1 ring-inset ring-gray-500/10">
                <CheckCircle2 size={12} />
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md ring-1 ring-inset ring-emerald-600/10">
                <CheckCircle2 size={12} />
                Ready
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 mt-2 pt-2 border-t">
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{task.durationDays}d</span>
            </div>
            <div className="font-mono text-[10px]">
              ES: {task.earlyStart} | EF: {task.earlyFinish}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
