'use client';

import { useStore } from '@/lib/store';
import { SectionCard } from './SectionCard';
import { getHighlightPriority } from '@/lib/evidence-index';
import { useMemo } from 'react';
import { buildEvidenceIndex } from '@/lib/evidence-index';

export function SpecPane() {
  const {
    spec,
    activeItemId,
    activeSentenceIndex,
    pinnedItemId,
    setActiveItem,
    setPinnedItem,
    updateItemText,
  } = useStore();

  const evidenceIndex = useMemo(() => {
    if (!spec) return null;
    return buildEvidenceIndex(spec);
  }, [spec]);

  if (!spec) return null;

  // Determine which item is highlighted (from hover, focus, pin, or reverse-lookup from sentence)
  let highlightedItems = new Set<string>();

  const priorityId = getHighlightPriority(activeItemId, null, pinnedItemId);
  if (priorityId) {
    highlightedItems.add(priorityId);
  } else if (activeSentenceIndex !== null && evidenceIndex) {
    const items = evidenceIndex.sentenceToItems.get(activeSentenceIndex);
    if (items) {
      highlightedItems = items;
    }
  }

  const handleHover = (id: string | null) => {
    setActiveItem(id);
  };
  const handlePin = (id: string) => {
    if (pinnedItemId === id) setPinnedItem(null);
    else setPinnedItem(id);
  };
  const clearPin = () => {
    setPinnedItem(null);
  };

  return (
    <div id="spec-pane-scroll-container" className="h-full overflow-y-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">{spec.title}</h1>
        {spec.summary && <div className="mb-4 text-sm text-muted-foreground">{spec.summary}</div>}
        {spec.problem && (
          <div className="mb-6 text-sm bg-muted/30 p-3 rounded-md">
            <strong>Problem: </strong>
            {spec.problem}
          </div>
        )}
      </div>
      {spec.userStories.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            User Stories
          </h3>
          {spec.userStories.map((us) => (
            <SectionCard
              key={us.id}
              id={us.id}
              title={`As a ${us.persona}`}
              editableText={us.want}
              isHighlighted={highlightedItems.has(us.id)}
              isPinned={pinnedItemId === us.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              I want {us.want} so that {us.soThat}
            </SectionCard>
          ))}
        </section>
      )}
      {spec.requirements.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Requirements
          </h3>
          {spec.requirements.map((req) => (
            <SectionCard
              key={req.id}
              id={req.id}
              title="Requirement"
              badges={[req.priority]}
              editableText={req.text}
              isHighlighted={highlightedItems.has(req.id)}
              isPinned={pinnedItemId === req.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {req.text}
            </SectionCard>
          ))}
        </section>
      )}
      {spec.acceptanceCriteria.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Acceptance Criteria
          </h3>
          {spec.acceptanceCriteria.map((ac) => (
            <SectionCard
              key={ac.id}
              id={ac.id}
              title={`For ${ac.requirementId}`}
              editableText={ac.given}
              isHighlighted={highlightedItems.has(ac.id)}
              isPinned={pinnedItemId === ac.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              Given {ac.given}, when {ac.when}, then {ac.then}
            </SectionCard>
          ))}
        </section>
      )}
      {spec.risks.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Risks
          </h3>
          {spec.risks.map((risk) => (
            <SectionCard
              key={risk.id}
              id={risk.id}
              title="Risk"
              badges={[`Severity: ${risk.severity}`]}
              editableText={risk.text}
              isHighlighted={highlightedItems.has(risk.id)}
              isPinned={pinnedItemId === risk.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {risk.text}
            </SectionCard>
          ))}
        </section>
      )}
      {spec.openQuestions.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Open Questions
          </h3>
          {spec.openQuestions.map((oq) => (
            <SectionCard
              key={oq.id}
              id={oq.id}
              title="Question"
              editableText={oq.question}
              isHighlighted={highlightedItems.has(oq.id)}
              isPinned={pinnedItemId === oq.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {oq.question} (Reason: {oq.reason})
            </SectionCard>
          ))}
        </section>
      )}
      {spec.tasks.length > 0 && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Tasks
          </h3>
          {spec.tasks.map((task) => (
            <SectionCard
              key={task.id}
              id={task.id}
              title={task.title}
              badges={[task.priority, task.size]}
              editableText={task.description}
              isHighlighted={highlightedItems.has(task.id)}
              isPinned={pinnedItemId === task.id}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {task.description}
              {task.dependsOn.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Depends on: {task.dependsOn.join(', ')}
                </div>
              )}
            </SectionCard>
          ))}
        </section>
      )}
      <div className="h-12" /> {/* Bottom padding */}
    </div>
  );
}
