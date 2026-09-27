import { NextRequest, NextResponse } from 'next/server';
import { getAllTasksAndDependencies, insertTask } from '@/lib/db/queries';
import { reconcileGraph } from '@/lib/graph/statusResolver';

export async function GET() {
  try {
    const { tasks, dependencies } = await getAllTasksAndDependencies();
    
    // Pipe raw DB rows through the deterministic math engine
    // Calculates Early Start (diamond delays), BLOCKED/READY status, and critical paths
    const computedTasks = reconcileGraph(tasks, dependencies);
    
    return NextResponse.json({ tasks: computedTasks, dependencies });
  } catch (error) {
    console.error('Failed to fetch graph:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const newTask = await insertTask({
      title: body.title,
      description: body.description,
      columnStatus: body.columnStatus,
      durationDays: body.durationDays,
      startDate: body.startDate,
    });

    return NextResponse.json(newTask, { status: 201 });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
