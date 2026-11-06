import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      status: 'not_configured',
      message: 'O checkout do Guia ainda está em preparação. Nenhuma cobrança foi realizada.',
    },
    { status: 501 },
  );
}
