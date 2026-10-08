'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { SectionCard } from './SectionCard';
import { useStore } from '@/lib/store';
import { buildEvidenceIndex, getHighlightPriority } from '@/lib/evidence-index';
import { useMemo } from 'react';

function CollapsibleSection({
  title,
  count,
  children,
  defaultExpanded = true,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (count === 0) return null;

  return (
    <section className="mb-8">
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
        aria-expanded={isExpanded}
        className="flex items-center gap-2 mb-2 hover:bg-slate/5 py-1 px-2 -ml-2 rounded-md transition-colors w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal group"
      >
        <span
          className={`text-slate transition-transform duration-200 motion-reduce:transition-none ${isExpanded ? 'rotate-90' : 'rotate-0'}`}
        >
          <ChevronRight size={18} />
        </span>
        <h3 className="text-lg font-medium text-ink">
          {title} <span className="text-slate ml-1 text-sm font-normal">({count})</span>
        </h3>
      </button>

      <div
        className={`grid transition-[grid-template-rows,opacity] duration-200 motion-reduce:transition-none ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col border-t border-border mt-2 pt-2">{children}</div>
        </div>
      </div>
    </section>
  );
}

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
    setPinnedItem(pinnedItemId === id ? null : id);
  };
  const clearPin = () => {
    setPinnedItem(null);
  };

  const getEvidence = (id: string) => {
    if (!evidenceIndex) return [];
    return Array.from(evidenceIndex.itemToSentences.get(id) || []).sort((a, b) => a - b);
  };

  return (
    <div id="spec-pane-scroll-container" className="h-full overflow-y-auto p-8 sm:p-12 lg:px-24">
      <div className="mb-12 max-w-[68ch]">
        <h1 className="font-newsreader text-[2.5rem] leading-[1.05] tracking-tight text-ink mb-4">
          {spec.title}
        </h1>
        {spec.summary && (
          <div className="text-lg text-slate leading-relaxed font-instrument mb-6">
            {spec.summary}
          </div>
        )}
        {spec.problem && (
          <div className="text-base text-ink bg-marker/10 p-4 rounded-lg border border-marker/20 font-instrument">
            <strong className="block mb-1 text-slate font-medium">Problem context</strong>
            {spec.problem}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <CollapsibleSection title="User stories" count={spec.userStories.length}>
          {spec.userStories.map((us, i) => (
            <SectionCard
              key={us.id}
              id={us.id}
              isLast={i === spec.userStories.length - 1}
              editableText={us.want}
              isHighlighted={highlightedItems.has(us.id)}
              isPinned={pinnedItemId === us.id}
              evidenceSentences={getEvidence(us.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              As a {us.persona}, I want {us.want} so that {us.soThat}
            </SectionCard>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Requirements" count={spec.requirements.length}>
          {spec.requirements.map((req, i) => (
            <SectionCard
              key={req.id}
              id={req.id}
              isLast={i === spec.requirements.length - 1}
              badges={[req.priority]}
              editableText={req.text}
              isHighlighted={highlightedItems.has(req.id)}
              isPinned={pinnedItemId === req.id}
              evidenceSentences={getEvidence(req.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {req.text}
            </SectionCard>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Acceptance criteria" count={spec.acceptanceCriteria.length}>
          {spec.acceptanceCriteria.map((ac, i) => (
            <SectionCard
              key={ac.id}
              id={ac.id}
              isLast={i === spec.acceptanceCriteria.length - 1}
              badges={[ac.requirementId]}
              editableText={ac.given}
              isHighlighted={highlightedItems.has(ac.id)}
              isPinned={pinnedItemId === ac.id}
              evidenceSentences={getEvidence(ac.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              Given {ac.given}, when {ac.when}, then {ac.then}
            </SectionCard>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Risks" count={spec.risks.length}>
          {spec.risks.map((risk, i) => (
            <SectionCard
              key={risk.id}
              id={risk.id}
              isLast={i === spec.risks.length - 1}
              badges={[`Severity ${risk.severity}`]}
              editableText={risk.text}
              isHighlighted={highlightedItems.has(risk.id)}
              isPinned={pinnedItemId === risk.id}
              evidenceSentences={getEvidence(risk.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              {risk.text}
            </SectionCard>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Open questions" count={spec.openQuestions.length}>
          {spec.openQuestions.map((oq, i) => (
            <SectionCard
              key={oq.id}
              id={oq.id}
              isLast={i === spec.openQuestions.length - 1}
              editableText={oq.question}
              isHighlighted={highlightedItems.has(oq.id)}
              isPinned={pinnedItemId === oq.id}
              evidenceSentences={getEvidence(oq.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              <span className="font-medium">{oq.question}</span>
              <span className="block text-slate text-sm mt-1">Reason: {oq.reason}</span>
            </SectionCard>
          ))}
        </CollapsibleSection>

        <CollapsibleSection title="Tasks" count={spec.tasks.length}>
          {spec.tasks.map((task, i) => (
            <SectionCard
              key={task.id}
              id={task.id}
              isLast={i === spec.tasks.length - 1}
              badges={[task.priority, task.size]}
              editableText={task.description}
              isHighlighted={highlightedItems.has(task.id)}
              isPinned={pinnedItemId === task.id}
              evidenceSentences={getEvidence(task.id)}
              onHover={handleHover}
              onClick={handlePin}
              onClearPin={clearPin}
              onSave={updateItemText}
            >
              <span className="font-medium block mb-1">{task.title}</span>
              {task.description}
              {task.dependsOn.length > 0 && (
                <div className="mt-2 text-xs text-slate">
                  Depends on: {task.dependsOn.join(', ')}
                </div>
              )}
            </SectionCard>
          ))}
        </CollapsibleSection>
      </div>
      <div className="h-24" /> {/* Extra bottom padding */}
    </div>
  );
}
