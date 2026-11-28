'use client';

import { useRef, useState } from 'react';
import { GripVertical, Share2 } from 'lucide-react';
import { OutboundLink } from '@/components/ui/outbound-link';
import type { CompactProjectItem } from '@/lib/multi-project-programs';

type DraggableProjectListProps = {
  items: readonly CompactProjectItem[];
  onShareItem?: (item: CompactProjectItem) => void | Promise<void>;
  emptyMessage?: string;
  testId?: string;
  maxHeightClass?: string;
};

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('a, button, input, select, textarea'));
}

export function DraggableProjectList({
  items,
  onShareItem,
  emptyMessage = 'Nenhum projeto disponível com esse filtro.',
  testId = 'draggable-project-list',
  maxHeightClass = 'max-h-80',
}: DraggableProjectListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ active: boolean; startY: number; startScrollTop: number }>({
    active: false,
    startY: 0,
    startScrollTop: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>): void {
    if (event.button !== 0 || isInteractiveTarget(event.target)) return;
    const container = containerRef.current;
    if (!container) return;
    dragState.current = {
      active: true,
      startY: event.clientY,
      startScrollTop: container.scrollTop,
    };
    setIsDragging(true);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>): void {
    if (!dragState.current.active) return;
    const container = containerRef.current;
    if (!container) return;
    const deltaY = event.clientY - dragState.current.startY;
    container.scrollTop = dragState.current.startScrollTop - deltaY;
  }

  function stopDragging(): void {
    if (!dragState.current.active) return;
    dragState.current.active = false;
    setIsDragging(false);
  }

  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-background/60 px-4 py-6 text-center text-sm opacity-70">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-foreground/60">
        <span className="inline-flex items-center gap-1">
          <GripVertical size={13} aria-hidden="true" />
          <span>Arraste ou role para navegar ({items.length})</span>
        </span>
        <span className="hidden sm:inline">Projeto | Valor | Entrar | Compartilhar</span>
      </div>

      <div
        ref={containerRef}
        data-testid={testId}
        tabIndex={0}
        aria-label="Lista rolável de projetos disponíveis"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={stopDragging}
        onPointerCancel={stopDragging}
        onPointerLeave={stopDragging}
        className={`${maxHeightClass} touch-pan-y overflow-y-auto overflow-x-hidden rounded-xl border border-border bg-background/70 p-2 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center justify-between gap-x-2.5 gap-y-2 px-2 py-2.5 text-xs sm:flex-nowrap"
            >
              <span className="min-w-0 flex-1 font-medium leading-snug text-foreground">
                {item.summaryPtBr}
              </span>

              <span className="hidden text-border sm:inline" aria-hidden="true">
                |
              </span>

              <span className="shrink-0 whitespace-nowrap rounded-full border border-neon/35 bg-neon/10 px-2.5 py-0.5 text-[11px] font-bold text-neon">
                {item.payLabel}
              </span>

              <span className="hidden text-border sm:inline" aria-hidden="true">
                |
              </span>

              <div className="flex shrink-0 items-center gap-1.5">
                <OutboundLink
                  href={item.href}
                  trackingId={item.trackingId}
                  sponsored
                  className="inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md bg-neon px-3 text-xs font-bold leading-none text-black transition hover:opacity-90"
                >
                  Quero entrar
                </OutboundLink>

                <span className="hidden text-border sm:inline" aria-hidden="true">
                  |
                </span>

                <button
                  type="button"
                  onClick={() => void onShareItem?.(item)}
                  aria-label={`Compartilhar ${item.summaryPtBr}`}
                  title="Compartilhar"
                  className="inline-flex h-9 shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-md border border-border px-2.5 text-xs font-bold leading-none text-neon transition hover:border-neon hover:bg-neon/10"
                >
                  <Share2 size={13} aria-hidden="true" />
                  <span>Compartilhar</span>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
