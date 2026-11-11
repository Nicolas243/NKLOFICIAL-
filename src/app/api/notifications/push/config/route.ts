import { NextResponse } from 'next/server';
import { getServerPushConfiguration } from '@/lib/notifications/push';

export function GET(): NextResponse {
  const configuration = getServerPushConfiguration();
  return NextResponse.json({
    enabled: configuration.enabled,
    publicKey: configuration.publicKey,
  });
}
