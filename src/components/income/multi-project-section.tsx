'use client';

import { useState } from 'react';
import { DraggableProjectList } from '@/components/income/draggable-project-list';
import { getMultiProjectGroup, type CompactProjectItem } from '@/lib/multi-project-programs';
import { getProgramShareUrl } from '@/lib/share-url';
import { SITE_URL } from '@/lib/site';

type MultiProjectSectionProps = {
  slug: string;
  programName: string;
};

export function MultiProjectSection({ slug, programName }: MultiProjectSectionProps) {
  const group = getMultiProjectGroup(slug);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  if (!group) return null;

  async function handleShareItem(item: CompactProjectItem): Promise<void> {
    const shareUrl = getProgramShareUrl(slug, SITE_URL, item.shareUrl);
    const shareData = {
      title: `${programName} · Portal NKL`,
      text: `${programName}: ${item.summaryPtBr} (${item.payLabel}).`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      setShareMessage('Projeto e link copiados para compartilhar.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setShareMessage('Não foi possível compartilhar agora.');
    }

    window.setTimeout(() => setShareMessage(null), 2600);
  }

  return (
    <section className="mt-5 rounded-xl border border-border bg-background/60 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-neon">
            Serviços e projetos em português
          </p>
          <h3 className="mt-0.5 font-bold text-base">{group.heading}</h3>
        </div>
        {shareMessage && (
          <p role="status" className="text-xs font-bold text-neon">
            {shareMessage}
          </p>
        )}
      </div>

      <DraggableProjectList
        items={group.items}
        onShareItem={handleShareItem}
        testId={`multi-project-list-${slug}`}
      />
    </section>
  );
}
