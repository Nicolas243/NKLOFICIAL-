export type ProjectionSource = 'recent-sample' | 'configured-preview';

export type ConfiguredProjection = {
  currentViews: number;
  averageDailyViews: number;
};

export type ProjectionInput = {
  recentDailyViews: number[];
  asOf?: Date;
  configuredPreview?: ConfiguredProjection;
};

export type ProjectionResult = {
  currentViews: number;
  projectedNovember: number;
  averageDailyViews: number;
  remainingDays: number;
  source: ProjectionSource;
};

export function getConfiguredProjectionFromEnv(
  env: Record<string, string | undefined> = process.env,
): ConfiguredProjection | null {
  const currentViews = Number(env.NOVEMBER_PROJECTION_CURRENT_VIEWS);
  const averageDailyViews = Number(env.NOVEMBER_PROJECTION_AVERAGE_DAILY_VIEWS);

  if (!Number.isFinite(currentViews) || !Number.isFinite(averageDailyViews)) {
    return null;
  }

  return { currentViews, averageDailyViews };
}

function nonNegativeInteger(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function remainingNovemberDays(asOf: Date): number {
  const month = asOf.getUTCMonth();
  if (month < 10) return 30;
  if (month > 10) return 0;

  const daysInNovember = new Date(Date.UTC(asOf.getUTCFullYear(), 11, 0)).getUTCDate();
  return Math.max(0, daysInNovember - asOf.getUTCDate());
}

export function calculateNovemberProjection(input: ProjectionInput): ProjectionResult {
  const asOf = input.asOf ?? new Date();
  const recentDailyViews = input.recentDailyViews
    .slice(-7)
    .map(nonNegativeInteger);

  let currentViews: number;
  let averageDailyViews: number;
  let source: ProjectionSource;

  if (recentDailyViews.length > 0) {
    const total = recentDailyViews.reduce((sum, views) => sum + views, 0);
    currentViews = total;
    averageDailyViews = Math.round(total / recentDailyViews.length);
    source = 'recent-sample';
  } else if (input.configuredPreview) {
    currentViews = nonNegativeInteger(input.configuredPreview.currentViews);
    averageDailyViews = nonNegativeInteger(input.configuredPreview.averageDailyViews);
    source = 'configured-preview';
  } else {
    throw new Error('Projection baseline is not configured');
  }

  const remainingDays = remainingNovemberDays(asOf);
  return {
    currentViews,
    projectedNovember: currentViews + averageDailyViews * remainingDays,
    averageDailyViews,
    remainingDays,
    source,
  };
}
