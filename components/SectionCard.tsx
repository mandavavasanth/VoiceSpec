'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Edit2 } from 'lucide-react';

interface SectionCardProps {
  id: string;
  globalIndex?: number;
  badges?: string[];
  evidenceSentences?: number[];
  isHighlighted: boolean;
  isPinned: boolean;
  isLast?: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void;
  onClearPin: () => void;
  onSave: (id: string, newText: string) => void;
  children: React.ReactNode;
  editableText?: string;
}

export function SectionCard({
  id,
  globalIndex = 0,
  badges = [],
  evidenceSentences = [],
  isHighlighted,
  isPinned,
  isLast = false,
  onHover,
  onClick,
  onClearPin,
  onSave,
  children,
  editableText,
}: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(editableText || '');
  const [justSaved, setJustSaved] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && !isPinned && elRef.current) {
      const container = document.getElementById('spec-pane-scroll-container');
      if (container) {
        const el = elRef.current;
        const rect = el.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        const isVisible = rect.top >= containerRect.top && rect.bottom <= containerRect.bottom;
        if (!isVisible) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          let offsetTop = 0;
          let current = el as HTMLElement | null;
          while (current !== null && current !== container) {
            offsetTop += current.offsetTop;
            current = current.offsetParent as HTMLElement | null;
          }
          container.scrollTo({
            top: Math.max(0, offsetTop - 40),
            behavior: prefersReduced ? 'auto' : 'smooth',
          });
        }
      }
    }
  }, [isHighlighted, isPinned]);

  const handleSave = () => {
    if (draftText !== editableText) {
      onSave(id, draftText);
      setJustSaved(true);
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        setJustSaved(false);
      }, 600);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      setDraftText(editableText || '');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isEditing) {
      onClearPin();
    }
  };

  // Convert priority to specific styling if known
  const getBadgeVariant = (text: string) => {
    const t = text.toLowerCase();
    if (t === 'p0' || t.includes('p0')) return 'default'; // P0 filled ink (simulated by default if mapped)
    if (t === 'p1' || t.includes('p1')) return 'outline'; // P1 outlined
    return 'secondary'; // P2 slate text
  };

  return (
    <div
      ref={elRef}
      id={`spec-item-${id}`}
      tabIndex={0}
      onMouseEnter={() => {
        if (!isEditing) onHover(id);
      }}
      onMouseLeave={() => {
        if (!isEditing) onHover(null);
      }}
      onFocus={() => {
        if (!isEditing) onHover(id);
      }}
      onBlur={() => {
        if (!isEditing) onHover(null);
      }}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button, input, a')) return;
        onClick(id);
      }}
      onKeyDown={handleGlobalKeyDown}
      style={{
        animationDuration: '400ms',
        animationDelay: `${String(globalIndex < 12 ? globalIndex * 30 : 0)}ms`,
      }}
      className={`group relative flex transition-colors duration-150 outline-none animate-in fade-in slide-in-from-bottom-2 fill-mode-both motion-reduce:animate-none motion-reduce:transition-none
        ${!isLast ? 'border-b border-border/50' : ''}
        ${justSaved ? 'bg-marker transition-[background-color] duration-[600ms] ease-out motion-reduce:transition-none' : isHighlighted ? 'bg-signal/5' : 'hover:bg-slate/5'}
        ${isPinned ? 'ring-2 ring-inset ring-signal' : ''}
        ${isHighlighted && !isPinned ? 'ring-1 ring-inset ring-signal/20' : ''}
      `}
    >
      {/* Left gutter with ID */}
      <div className="w-16 sm:w-20 shrink-0 py-3 pl-3 sm:pl-4 text-xs font-mono text-slate/70">
        {id}
      </div>

      <div className="flex-1 py-3 pr-3 sm:pr-4 flex gap-3 min-w-0">
        {/* Priority Chips */}
        {badges.length > 0 && (
          <div className="flex shrink-0 flex-col gap-1 mt-0.5">
            {badges.map((b) => {
              const v = getBadgeVariant(b);
              let styleClass =
                'rounded-controls text-[10px] font-semibold h-5 px-1.5 uppercase tracking-wider flex items-center justify-center whitespace-nowrap';

              if (v === 'default') styleClass += ' bg-ink text-sheet';
              else if (v === 'outline')
                styleClass += ' border border-slate text-ink bg-transparent';
              else styleClass += ' bg-slate/10 text-slate';

              return (
                <div key={b} className={styleClass}>
                  {b}
                </div>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 text-[15px] leading-snug">
          {isEditing ? (
            <Input
              autoFocus
              value={draftText}
              onChange={(e) => {
                setDraftText(e.target.value);
              }}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="h-8 text-[15px] py-1 px-2 mb-1 shadow-sm rounded-controls font-instrument focus-visible:ring-signal focus-visible:ring-offset-1"
            />
          ) : (
            <div className="break-words text-ink font-instrument">
              {children}
              {evidenceSentences.length > 0 && (
                <sup className="ml-1 text-xs text-slate/60 font-mono tracking-tighter cursor-default select-none pointer-events-none">
                  [{evidenceSentences.join(',')}]
                </sup>
              )}
            </div>
          )}
        </div>

        {/* Edit Button */}
        {editableText && !isEditing && (
          <div className="shrink-0 flex opacity-0 group-hover:opacity-100 group-focus:opacity-100 group-focus-within:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-slate hover:text-ink rounded-controls"
              onClick={(e) => {
                e.stopPropagation();
                setDraftText(editableText);
                setIsEditing(true);
              }}
              aria-label={`Edit ${id}`}
            >
              <Edit2 size={14} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
