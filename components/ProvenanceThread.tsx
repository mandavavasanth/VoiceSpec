'use client';

import { useStore } from '@/lib/store';
import { useEffect, useState } from 'react';
import { getHighlightPriority } from '@/lib/evidence-index';
import { useIsMobile } from '@/lib/use-mobile';

export function ProvenanceThread() {
  const { activeItemId, activeSentenceIndex, pinnedItemId } = useStore();
  const [paths, setPaths] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPaths([]);
      setIsVisible(false);
      return;
    }

    const priorityId = getHighlightPriority(activeItemId, null, pinnedItemId);
    let targetEl: Element | null = null;
    if (priorityId) {
      targetEl = document.getElementById(`spec-item-${priorityId}`);
    }
    if (!targetEl) {
      targetEl =
        document.querySelector('[class*="bg-signal/5"]') || document.querySelector('.ring-signal');
    }

    if (targetEl) {
      const updatePath = () => {
        const tRect = targetEl.getBoundingClientRect();
        const endX = tRect.left;
        const endY = tRect.top + tRect.height / 2;

        const newPaths: string[] = [];

        // Find source elements
        // Select all highlighted sentences (bg-marker)
        const sourceEls = Array.from(document.querySelectorAll('.bg-marker[data-sentence-index]'))
          .sort((a, b) => {
            const idxA = parseInt(a.getAttribute('data-sentence-index') || '0', 10);
            const idxB = parseInt(b.getAttribute('data-sentence-index') || '0', 10);
            return idxA - idxB;
          })
          .slice(0, 6); // ENFORCED HERE: at most 6 paths using lowest indexes

        if (sourceEls.length === 0 && document.querySelector('.bg-marker')) {
          const el = document.querySelector('.bg-marker');
          if (el) sourceEls.push(el);
        }

        sourceEls.forEach((sourceEl) => {
          const sRect = sourceEl.getBoundingClientRect();
          const startX = sRect.right;
          const startY = sRect.top + sRect.height / 2;
          const cp1X = startX + (endX - startX) / 3;
          const cp1Y = startY;
          const cp2X = startX + (2 * (endX - startX)) / 3;
          const cp2Y = endY;
          newPaths.push(
            `M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${cp1X.toFixed(1)} ${cp1Y.toFixed(1)}, ${cp2X.toFixed(1)} ${cp2Y.toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`,
          );
        });

        setPaths(newPaths);
        setIsVisible(newPaths.length > 0);
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
        transition: isVisible ? 'none' : 'opacity 250ms ease-out',
      }}
    >
      {paths.map((p, i) => (
        <path
          key={i}
          d={p}
          fill="none"
          stroke="hsl(var(--signal))"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
