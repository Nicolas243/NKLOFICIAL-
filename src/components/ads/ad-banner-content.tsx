/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import type { ActiveAdSlot } from '@/lib/ad-inventory';

type AdBannerContentProps = {
  placement?: 'home' | 'in-feed' | 'sales';
  slots: ActiveAdSlot[];
  monthlyPriceCents: number;
  isPromotionActive: boolean;
  showOfferDetails?: boolean;
};

const EMPTY_SLOT: ActiveAdSlot = {
  slotNumber: 0,
  campaignId: null,
  businessName: null,
  assetUrl: null,
  assetMimeType: null,
  assetAltText: null,
  destinationUrl: null,
};

function FilledSlot({ slot }: { slot: ActiveAdSlot }) {
  if (!slot.assetUrl || !slot.destinationUrl) {
    return <div className="h-full min-w-0 flex-1 bg-[linear-gradient(135deg,#181818,#2b241d)]" aria-hidden="true" />;
  }

  return (
    <a
      href={`/api/ads/click?slot=${slot.slotNumber}`}
      aria-label={`Visitar anúncio de ${slot.businessName ?? 'empresa parceira'}`}
      className="block h-full min-w-0 flex-1 overflow-hidden bg-black transition-opacity hover:opacity-85"
      rel="sponsored noopener"
    >
      {slot.assetMimeType === 'video/webm' ? (
        <video
          src={slot.assetUrl}
          aria-label={slot.assetAltText ?? slot.businessName ?? 'Anúncio'}
          className="h-full w-full object-cover"
          muted
          loop
          autoPlay
          playsInline
        />
      ) : (
        <img
          src={slot.assetUrl}
          alt={slot.assetAltText ?? slot.businessName ?? 'Anúncio'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      )}
    </a>
  );
}

export function AdBannerContent({
  placement = 'in-feed',
  slots,
}: AdBannerContentProps) {
  const normalizedSlots = Array.from({ length: 10 }, (_, index) => slots[index] ?? {
    ...EMPTY_SLOT,
    slotNumber: index + 1,
  });
  const hasActiveCampaign = normalizedSlots.some((slot) => slot.campaignId);
  const marqueeText = 'ANUNCIE SUA MARCA NO PORTAL NKL';

  return (
    <section
      aria-label="Anúncio do Portal NKL"
      className="mx-auto h-44 w-full max-w-7xl overflow-hidden rounded-[1.35rem] border border-orange/35 bg-[#171411] shadow-[0_20px_55px_rgba(70,55,35,0.16)] sm:h-48 md:h-56"
      data-ad-placement={placement}
    >
      <div className="relative h-full overflow-hidden">
        <div className={hasActiveCampaign ? 'ad-banner-slot-track relative flex h-full w-full' : 'relative flex h-full w-full'}>
          {normalizedSlots.map((slot) => <FilledSlot key={slot.slotNumber} slot={slot} />)}

          {!hasActiveCampaign && (
            <>
              <Link
                href="/programas/anuncie"
                aria-label="Anuncie no Portal NKL"
                className="absolute inset-0 z-10"
              />
              <div aria-hidden="true" className="ad-banner-marquee pointer-events-none absolute inset-y-0 left-0 flex w-full items-center">
                <div className="ad-banner-marquee-track">
                  <span className="font-playfair text-[clamp(2.8rem,8vw,7.5rem)] font-black uppercase leading-none tracking-[-0.06em] text-white/95">
                    <span className="px-8 sm:px-16">{marqueeText}</span>
                  </span>
                  <span className="font-playfair text-[clamp(2.8rem,8vw,7.5rem)] font-black uppercase leading-none tracking-[-0.06em] text-white/95">
                    <span className="px-8 sm:px-16">{marqueeText}</span>
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
