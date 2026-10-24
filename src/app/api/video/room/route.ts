import { NextResponse } from 'next/server';
import { env } from '@/env';

type DailyRoomResponse = {
  url?: string;
};

export async function POST(): Promise<NextResponse<{ url: string } | { error: string }>> {
  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.DAILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        privacy: 'private',
        properties: {
          exp: Math.floor(Date.now() / 1000) + 3600,
        },
      }),
    });

    if (!response.ok) {
      console.error('[DAILY_ROOM] Falha ao criar sala:', response.status);
      return NextResponse.json({ error: 'Não foi possível criar a sala de aula.' }, { status: 502 });
    }

    const data: DailyRoomResponse = await response.json();
    if (!data.url) {
      console.error('[DAILY_ROOM] Resposta sem URL de sala.');
      return NextResponse.json({ error: 'A sala foi criada sem uma URL válida.' }, { status: 502 });
    }

    return NextResponse.json({ url: data.url });
  } catch (error) {
    console.error('[DAILY_ROOM] Falha de comunicação:', error instanceof Error ? error.message : 'erro desconhecido');
    return NextResponse.json({ error: 'Não foi possível acessar o serviço de vídeo.' }, { status: 502 });
  }
}
