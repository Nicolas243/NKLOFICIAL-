'use client';

import { useEffect, useMemo, useState } from 'react';

const TAG_CLICKS_KEY = 'nkl_tag_clicks';
const PRIORITY_TAG = 'Melhor para Começar';

type TagClicks = Record<string, number>;

type SmartTagListProps = {
  tags: string[];
};

function isTagClicks(value: unknown): value is TagClicks {
  return typeof value === 'object'
    && value !== null
    && Object.values(value).every((count) => typeof count === 'number' && Number.isFinite(count));
}

export function SmartTagList({ tags }: SmartTagListProps) {
  const [tagClicks, setTagClicks] = useState<TagClicks>({});

  useEffect(() => {
    const stored = window.localStorage.getItem(TAG_CLICKS_KEY);
    if (!stored) return;

    try {
      const parsed: unknown = JSON.parse(stored);
      if (isTagClicks(parsed)) {
        window.setTimeout(() => setTagClicks(parsed), 0);
      }
    } catch (error) {
      console.error('[SMART_TAG_LIST] Não foi possível ler a frequência das tags:', error instanceof Error ? error.message : 'erro desconhecido');
    }
  }, []);

  const orderedTags = useMemo(() => [...tags].sort((left, right) => {
    if (left === PRIORITY_TAG && right !== PRIORITY_TAG) return -1;
    if (right === PRIORITY_TAG && left !== PRIORITY_TAG) return 1;

    const clickDifference = (tagClicks[right] ?? 0) - (tagClicks[left] ?? 0);
    return clickDifference !== 0 ? clickDifference : tags.indexOf(left) - tags.indexOf(right);
  }), [tagClicks, tags]);

  function registerTagClick(tag: string): void {
    const nextClicks = {
      ...tagClicks,
      [tag]: (tagClicks[tag] ?? 0) + 1,
    };
    setTagClicks(nextClicks);
    window.localStorage.setItem(TAG_CLICKS_KEY, JSON.stringify(nextClicks));
  }

  if (orderedTags.length === 0) return null;

  return (
    <div className="min-w-0">
      <div data-testid="program-tags" className="nkl-scrollbar-hidden max-h-24 overflow-y-auto pr-1" tabIndex={0} aria-label="Tags da oportunidade. Role para ver todas.">
        <div className="flex flex-wrap content-start gap-1.5">
        {orderedTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              registerTagClick(tag);
            }}
            className={tag === PRIORITY_TAG
              ? 'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-700 dark:text-green-400'
              : 'max-w-full overflow-hidden text-ellipsis whitespace-nowrap rounded-full border border-border px-2.5 py-1 text-xs opacity-75 transition-colors hover:border-orange-500/50 hover:text-orange-500'}
          >
            {tag === PRIORITY_TAG && (
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0" aria-hidden="true">
                <path fill="currentColor" d="M8 1.5 9.7 6l4.8.2-3.8 2.9 1.3 4.7L8 11.1l-4 2.7 1.3-4.7-3.8-2.9L6.3 6 8 1.5Z" />
              </svg>
            )}
            {tag}
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
