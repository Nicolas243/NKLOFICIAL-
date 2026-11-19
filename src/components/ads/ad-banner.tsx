import { getActiveAdSlots, getAdPricing, type ActiveAdSlot } from '@/lib/ad-inventory';
import { AdBannerContent } from './ad-banner-content';

export { AdBannerContent } from './ad-banner-content';

export async function AdBanner({ placement = 'in-feed' }: { placement?: 'home' | 'in-feed' | 'sales' }) {
  let slots: ActiveAdSlot[] = [];
  try {
    slots = await getActiveAdSlots();
  } catch (error) {
    console.error('[AD_BANNER] Falha ao carregar inventário:', error);
  }

  const pricing = getAdPricing();
  return (
    <AdBannerContent
      placement={placement}
      slots={slots}
      monthlyPriceCents={pricing.monthlyPriceCents}
      isPromotionActive={pricing.isPromotionActive}
    />
  );
}
