'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { getHighlightPriority } from '@/lib/evidence-index';
import { useIsMobile } from '@/lib/use-mobile';

export function ProvenanceThread() {
  const { activeItemId, activeSentenceIndex, pinnedItemId } = useStore();
  const [path, setPath] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPath(null);

      setIsVisible(false);
      return;
    }

    const priorityId = getHighlightPriority(activeItemId, null, pinnedItemId);

    let sourceEl: Element | null = null;
    let targetEl: Element | null = null;

    if (activeSentenceIndex !== null) {
      sourceEl = document.getElementById(`sentence-${String(activeSentenceIndex)}`);
    }

    if (!sourceEl) {
      sourceEl = document.querySelector('.bg-marker');
    }

    if (priorityId) {
      targetEl = document.getElementById(`spec-item-${priorityId}`);
    }

    if (!targetEl) {
      // Find the first spec item that is highlighted (bg-signal/5) or pinned (ring-signal)
      targetEl =
        document.querySelector('[class*="bg-signal/5"]') || document.querySelector('.ring-signal');
    }

    if (sourceEl && targetEl) {
      const updatePath = () => {
        const sourceRect = sourceEl.getBoundingClientRect();
        const targetRect = targetEl.getBoundingClientRect();

        // Connect right side of source to left side of target
        const startX = sourceRect.right;
        const startY = sourceRect.top + sourceRect.height / 2;

        const endX = targetRect.left;
        const endY = targetRect.top + targetRect.height / 2;

        const cp1X = startX + (endX - startX) / 3;
        const cp1Y = startY;
        const cp2X = startX + (2 * (endX - startX)) / 3;
        const cp2Y = endY;

        setPath(
          `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`,
        );
        setIsVisible(true);
      };

      updatePath();

      let frameId: number;
      const loop = () => {
        updatePath();
        frameId = requestAnimationFrame(loop);
      };
      frameId = requestAnimationFrame(loop);

      window.addEventListener('scroll', updatePath, true);
      window.addEventListener('resize', updatePath);

      return () => {
        cancelAnimationFrame(frameId);
        window.removeEventListener('scroll', updatePath, true);
        window.removeEventListener('resize', updatePath);
      };
    } else {
      setIsVisible(false);
    }
  }, [activeItemId, activeSentenceIndex, pinnedItemId, isMobile]);

  if (isMobile) return null;

  return (
    <svg
      className="pointer-events-none fixed inset-0 z-50 w-full h-full"
      style={{
        opacity: isVisible ? 1 : 0,
        transition: isVisible ? 'opacity 0ms' : 'opacity 250ms ease-out',
      }}
    >
      {path && (
        <path
          d={path}
          fill="none"
          stroke="hsl(var(--signal))"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
