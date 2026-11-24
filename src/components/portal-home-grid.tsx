import { PortalAreaExplorer } from '@/components/home/portal-area-explorer';
import {
  PORTAL_AREA_CARDS,
  getValidPortalAreaCards,
  type PortalAreaCard,
} from '@/lib/portal-areas';

/** Grade central da pagina inicial conectada ao registro unico de areas. */
export function PortalHomeGrid({
  cards = PORTAL_AREA_CARDS,
}: {
  cards?: readonly PortalAreaCard[];
}) {
  const validCards = getValidPortalAreaCards(cards);

  if (validCards.length === 0) {
    return (
      <div className="portal-empty" role="status">
        <p className="portal-empty-title">As áreas do Portal NKL estão sendo organizadas.</p>
        <p className="portal-empty-copy">
          Volte em instantes para acessar os guias, estudos e oportunidades disponíveis.
        </p>
      </div>
    );
  }

  return <PortalAreaExplorer cards={validCards} />;
}
