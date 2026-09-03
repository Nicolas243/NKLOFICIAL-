import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  guardPasswordChange,
  recordSuccessfulPasswordChange,
} from '@/lib/rate-limit';

const MIN_PASSWORD_LENGTH = 8;

type ChangePasswordBody = {
  currentPassword?: unknown;
  newPassword?: unknown;
};

/**
 * Troca de senha do usuário autenticado.
 *
 * Segurança:
 * - O userId NUNCA vem do corpo da requisição — é extraído da sessão JWT
 *   (anti-escalonamento: ninguém altera a senha de terceiro).
 * - Rate limit distribuído (Postgres/Drizzle): 1 sucesso por 12h + exponential
 *   backoff em tentativas excessivas. O contador incrementa antes da verificação.
 * - `currentPassword` é validada reautenticando com o e-mail da sessão.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    // 1) Rate limit — chamado ANTES de qualquer verificação (registra abuso).
    const guard = await guardPasswordChange(user.id);
    if (!guard.ok) {
      return NextResponse.json(
        {
          error:
            guard.reason === 'cooldown'
              ? 'Sua senha já foi alterada recentemente. Tente novamente em até 12 horas.'
              : 'Muitas tentativas. Aguarde o período de bloqueio.',
          retryAfterMs: guard.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // 2) Validação do corpo.
    const body = (await request.json()) as ChangePasswordBody;
    if (typeof body.currentPassword !== 'string' || !body.currentPassword) {
      return NextResponse.json({ error: 'Senha atual obrigatória.' }, { status: 400 });
    }
    if (
      typeof body.newPassword !== 'string' ||
      body.newPassword.length < MIN_PASSWORD_LENGTH
    ) {
      return NextResponse.json(
        { error: `A nova senha deve ter no mínimo ${MIN_PASSWORD_LENGTH} caracteres.` },
        { status: 400 }
      );
    }
    if (body.currentPassword === body.newPassword) {
      return NextResponse.json(
        { error: 'A nova senha deve ser diferente da senha atual.' },
        { status: 400 }
      );
    }

    // 3) Reautenticação com a senha atual (email vindo da sessão).
    if (!user.email) {
      return NextResponse.json({ error: 'Conta sem e-mail válido.' }, { status: 400 });
    }
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: body.currentPassword,
    });
    if (verifyError) {
      return NextResponse.json({ error: 'Senha atual incorreta.' }, { status: 401 });
    }

    // 4) Atualização da senha.
    const { error: updateError } = await supabase.auth.updateUser({
      password: body.newPassword,
    });
    if (updateError) {
      console.error('Erro ao atualizar senha:', updateError.message);
      return NextResponse.json({ error: 'Falha ao atualizar a senha.' }, { status: 500 });
    }

    // 5) Registra o sucesso (abre o cooldown de 12h).
    await recordSuccessfulPasswordChange(user.id);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error('Change-password error:', error);
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}