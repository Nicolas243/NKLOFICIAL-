type AdPreviewTileProps = {
  index: number;
  compact?: boolean;
};

export function AdPreviewTile({ index, compact = false }: AdPreviewTileProps) {
  return (
    <div
      data-testid="ad-preview-tile"
      aria-label={`Espa?o publicit?rio de pr?via ${index}`}
      className={[
        'flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-lg border border-dashed border-neon/45 bg-income-card/80 p-2 text-center',
        compact ? 'text-[0.65rem]' : 'text-xs',
      ].join(' ')}
    >
      <span className="font-bold uppercase tracking-[0.12em] text-neon/80">Sua marca</span>
    </div>
  );
}
