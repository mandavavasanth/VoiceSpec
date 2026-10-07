import { Spec } from './schema';

/**
 * Checks the integrity of a generated spec:
 * 1. Ensures IDs are unique and sequential (e.g. US-001, US-002).
 *    If renumbered, remaps all cross-references (requirementId, requirementIds, dependsOn).
 * 2. Validates reference resolution (removes dangling refs).
 * 3. Detects cyclic dependencies in tasks and removes offending edges.
 */
export function checkIntegrity(spec: Spec, warnings: string[]): Spec {
  const result = JSON.parse(JSON.stringify(spec)) as Spec; // Deep clone

  const idMap = new Map<string, string>(); // oldId -> newId

  // Helper to renumber IDs and populate idMap
  const renumber = (items: { id: string }[], prefix: string) => {
    items.forEach((item, index) => {
      const oldId = item.id;
      const expectedId = `${prefix}-${String(index + 1).padStart(3, '0')}`;
      if (oldId !== expectedId) {
        idMap.set(oldId, expectedId);
        item.id = expectedId;
      }
    });
  };

  // 1. Renumber IDs
  renumber(result.userStories, 'US');
  renumber(result.requirements, 'FR');
  renumber(result.acceptanceCriteria, 'AC');
  renumber(result.risks, 'RK');
  renumber(result.openQuestions, 'OQ');
  renumber(result.tasks, 'T');

  if (idMap.size > 0) {
    warnings.push(`Renumbered ${String(idMap.size)} non-sequential or duplicate IDs.`);
  }

  // 2. Remap and validate references
  const validRequirementIds = new Set(result.requirements.map((r) => r.id));
  const validTaskIds = new Set(result.tasks.map((t) => t.id));

  // AC -> Requirement
  result.acceptanceCriteria = result.acceptanceCriteria.filter((ac) => {
    const newId = idMap.get(ac.requirementId);
    if (newId) {
      ac.requirementId = newId;
    }
    if (!validRequirementIds.has(ac.requirementId)) {
      warnings.push(`Removed AC ${ac.id} due to dangling requirementId ${ac.requirementId}.`);
      return false;
    }
    return true;
  });

  // Task -> Requirements & DependsOn
  result.tasks.forEach((task) => {
    task.requirementIds = task.requirementIds
      .map((id) => idMap.get(id) || id)
      .filter((id) => {
        if (!validRequirementIds.has(id)) {
          warnings.push(`Removed dangling requirementId ${id} from task ${task.id}.`);
          return false;
        }
        return true;
      });

    task.dependsOn = task.dependsOn
      .map((id) => idMap.get(id) || id)
      .filter((id) => {
        if (!validTaskIds.has(id)) {
          warnings.push(`Removed dangling dependsOn ${id} from task ${task.id}.`);
          return false;
        }
        return true;
      });
  });

  // 3. Cycle Detection (Topological Sort via DFS)
  const taskMap = new Map(result.tasks.map((t) => [t.id, t]));
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const checkCycle = (taskId: string) => {
    if (visiting.has(taskId)) return true; // Cycle detected
    if (visited.has(taskId)) return false;

    visiting.add(taskId);
    const task = taskMap.get(taskId);
    if (task) {
      // Iterate backwards so we can safely mutate the array
      for (let i = task.dependsOn.length - 1; i >= 0; i--) {
        const depId = task.dependsOn[i];
        if (depId && checkCycle(depId)) {
          // Cycle found! Remove the offending edge
          warnings.push(`Removed cyclic dependency ${depId} from task ${taskId}.`);
          task.dependsOn.splice(i, 1);
        }
      }
    }
    visiting.delete(taskId);
    visited.add(taskId);
    return false;
  };

  result.tasks.forEach((t) => {
    if (!visited.has(t.id)) {
      checkCycle(t.id);
    }
  });

  return result;
}
