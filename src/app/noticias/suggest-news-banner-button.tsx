'use client';

export function SuggestNewsBannerButton() {
  return (
    <button
      type="button"
      className="px-4 py-2 bg-neon/10 border border-neon/30 text-neon rounded-lg font-semibold text-sm hover:bg-neon/20 transition-colors"
      onClick={() => {
        const modalBtn = document.querySelector<HTMLButtonElement>('[data-suggest-news]');
        modalBtn?.click();
      }}
    >
      Quero noticiar algo
    </button>
  );
}