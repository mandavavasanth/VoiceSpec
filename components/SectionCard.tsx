'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronDown, ChevronRight, Edit2 } from 'lucide-react';

interface SectionCardProps {
  id: string;
  title: string;
  badges?: string[];
  evidenceSentences?: number[]; // array of sentence indices for this item
  isHighlighted: boolean;
  isPinned: boolean;
  onHover: (id: string | null) => void;
  onClick: (id: string) => void; // pinning
  onClearPin: () => void;
  onSave: (id: string, newText: string) => void;
  children: React.ReactNode;
  editableText?: string;
  // For ACs, they don't have their own evidence. We just pass their requirement's sentences via the index.
}

export function SectionCard({
  id,
  title,
  badges = [],
  isHighlighted,
  isPinned,
  onHover,
  onClick,
  onClearPin,
  onSave,
  children,
  editableText,
}: SectionCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState(editableText || '');
  const [isCollapsed, setIsCollapsed] = useState(false);

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
          // Calculate offset taking into account that the element might be nested
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

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(false);
      setDraftText(editableText || '');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onSave(id, draftText);
      setIsEditing(false);
    }
  };

  const handleGlobalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !isEditing) {
      onClearPin();
    }
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
        // don't pin if clicking the edit input or button
        if ((e.target as HTMLElement).closest('button, input')) return;
        onClick(id);
      }}
      onKeyDown={handleGlobalKeyDown}
      className={`relative mb-2 transition-colors duration-200 cursor-default outline-none rounded-md
        ${isHighlighted ? 'bg-primary/10 border-l-4 border-primary ring-2 ring-primary/50' : 'border-l-4 border-transparent'}
        ${isPinned ? 'ring-2 ring-primary' : ''}
      `}
    >
      <Card className="shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              onClick={() => {
                setIsCollapsed(!isCollapsed);
              }}
              className="mt-1 text-muted-foreground hover:text-foreground shrink-0"
              aria-label={isCollapsed ? 'Expand' : 'Collapse'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
            </button>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-semibold text-sm">{id}</span>
                {badges.map((b) => (
                  <Badge key={b} variant="secondary" className="text-[10px] px-1 py-0 h-4">
                    {b}
                  </Badge>
                ))}
                {editableText && !isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 ml-auto text-muted-foreground"
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setDraftText(editableText);
                      setIsEditing(true);
                    }}
                  >
                    <Edit2 size={12} />
                  </Button>
                )}
              </div>

              {!isCollapsed && (
                <div className="text-sm">
                  {isEditing ? (
                    <Input
                      autoFocus
                      value={draftText}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setDraftText(e.target.value);
                      }}
                      onKeyDown={handleKeyDown}
                      onBlur={() => {
                        onSave(id, draftText);
                        setIsEditing(false);
                      }}
                      className="h-7 text-sm py-1 px-2"
                    />
                  ) : (
                    <div className="break-words">
                      <span className="font-medium mr-1">{title}:</span>
                      {children}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
