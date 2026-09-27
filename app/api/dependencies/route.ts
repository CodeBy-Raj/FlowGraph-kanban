import { NextRequest, NextResponse } from 'next/server';
import { getAllTasksAndDependencies, insertDependency, deleteDependency } from '@/lib/db/queries';
import { willCreateCycle } from '@/lib/graph/cycleDetector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { predecessorId, successorId } = body;

    if (!predecessorId || !successorId) {
      return NextResponse.json({ error: 'predecessorId and successorId are required' }, { status: 400 });
    }

    if (predecessorId === successorId) {
      return NextResponse.json({ error: 'A task cannot depend on itself' }, { status: 400 });
    }

    // 1. Fetch current topology to validate against
    const { dependencies } = await getAllTasksAndDependencies();

    // 2. Execute deterministic cycle guardrail (DFS)
    if (willCreateCycle(dependencies, predecessorId, successorId)) {
      return NextResponse.json(
        { error: 'Circular dependency detected: Adding this dependency creates a cycle. The existing graph remains unchanged.' },
        { status: 400 }
      );
    }

    // 3. Persist valid edge
    const newEdge = await insertDependency(predecessorId, successorId);
    return NextResponse.json(newEdge, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create dependency:', error);
    // Handle unique constraint violations gracefully
    if (error.message?.includes('duplicate key value')) {
      return NextResponse.json({ error: 'Dependency already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const predecessorId = searchParams.get('pred');
    const successorId = searchParams.get('succ');

    if (!predecessorId || !successorId) {
      return NextResponse.json({ error: 'pred and succ query parameters are required' }, { status: 400 });
    }

    const success = await deleteDependency(predecessorId, successorId);
    
    if (!success) {
      return NextResponse.json({ error: 'Dependency not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Failed to delete dependency:', error);
    return NextResponse.json({ error: 'Failed to delete dependency' }, { status: 500 });
  }
}
