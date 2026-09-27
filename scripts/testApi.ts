import 'dotenv/config';
import { getAllTasksAndDependencies } from '../lib/db/queries';
import { reconcileGraph } from '../lib/graph/statusResolver';

async function testApi() {
  console.log('Fetching tasks and dependencies from DB...');
  const { tasks, dependencies } = await getAllTasksAndDependencies();
  console.log(`Fetched ${tasks.length} tasks and ${dependencies.length} dependencies.`);

  const computedTasks = reconcileGraph(tasks, dependencies);
  
  console.log('\n--- Computed Tasks Summary ---');
  for (const t of computedTasks) {
    console.log(`[${t.title}] (${t.id}):`);
    console.log(`  columnStatus: ${t.columnStatus}`);
    console.log(`  dependencyStatus: ${t.dependencyStatus}, isBlocked: ${t.isBlocked}`);
    console.log(`  earlyStart: ${t.earlyStart}, earlyFinish: ${t.earlyFinish}`);
    console.log(`  startDate: ${t.startDate}, endDate: ${t.endDate}`);
    if (t.blockingPredecessorIds.length > 0) {
      console.log(`  blockingPredecessors: ${t.blockingPredecessorIds.join(', ')}`);
    }
  }
}

testApi()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
