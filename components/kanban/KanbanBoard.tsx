'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import TaskCard from './TaskCard';
import { ComputedTask, ColumnStatus } from '@/lib/graph/types';

const COLUMNS: { id: ColumnStatus; title: string }[] = [
  { id: 'BACKLOG', title: 'Backlog' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'REVIEW', title: 'Review' },
  { id: 'DONE', title: 'Done' }
];

export default function KanbanBoard({
  tasks,
  fetchGraph,
}: {
  tasks: ComputedTask[];
  fetchGraph: () => Promise<void>;
}) {
  const [localTasks, setLocalTasks] = useState<ComputedTask[]>(tasks);

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const task = localTasks.find((t) => t.id === draggableId);
    const newStatus = destination.droppableId as ColumnStatus;

    // Defend against executing blocked tasks
    if (task?.isBlocked && (newStatus === 'IN_PROGRESS' || newStatus === 'DONE')) {
      toast.error('Dependency Violation: Cannot advance a blocked task.');
      return;
    }

    // Optimistic UI update
    const previousTasks = [...localTasks];
    setLocalTasks((current) =>
      current.map((t) => (t.id === draggableId ? { ...t, columnStatus: newStatus } : t))
    );

    // Persist mutation and trigger backend state regression cascade
    try {
      const res = await fetch(`/api/tasks/${draggableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columnStatus: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update task');
      
      // Re-fetch strictly to receive the newly computed downstream topological states (e.g., regression rollbacks)
      await fetchGraph();
    } catch (error) {
      toast.error('Failed to sync board state. Reverting.');
      setLocalTasks(previousTasks);
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 min-h-[500px] overflow-x-auto p-4 bg-gray-50 rounded-xl border border-gray-200">
        {COLUMNS.map((col) => {
          const columnTasks = localTasks.filter((t) => t.columnStatus === col.id);
          return (
            <div key={col.id} className="flex flex-col flex-shrink-0 w-80 bg-gray-100/50 rounded-xl border border-gray-200">
              <div className="p-3 border-b border-gray-200 flex justify-between items-center bg-gray-100/80 rounded-t-xl">
                <h3 className="font-semibold text-gray-700">{col.title}</h3>
                <span className="bg-gray-200 text-gray-600 text-xs py-1 px-2 rounded-full font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 p-3 min-h-[150px] transition-colors ${
                      snapshot.isDraggingOver ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    {columnTasks.map((task, index) => (
                      <TaskCard key={task.id} task={task} index={index} />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
