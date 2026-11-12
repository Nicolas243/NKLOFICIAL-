import { NextResponse } from 'next/server';
import {
  calculateNovemberProjection,
  getConfiguredProjectionFromEnv,
} from '@/lib/analytics/november-projection';

export const dynamic = 'force-dynamic';

export function GET() {
  const configuredPreview = getConfiguredProjectionFromEnv();
  if (!configuredPreview) {
    return NextResponse.json(
      {
        error: 'A projecao de visualizacoes ainda nao foi configurada.',
        code: 'PROJECTION_NOT_CONFIGURED',
      },
      { status: 503 },
    );
  }

  const projection = calculateNovemberProjection({
    recentDailyViews: [],
    configuredPreview,
  });

  return NextResponse.json(projection);
}
