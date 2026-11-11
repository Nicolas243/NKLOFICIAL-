type AuthError = {
  message?: string;
  status?: number;
} | null;

export function getLoginErrorMessage(error: AuthError): string {
  const message = error?.message?.toLowerCase() ?? '';

  if (message.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar.';
  }

  if (error?.status === 429 || message.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }

  if (message.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.';
  }

  if (
    message.includes('unsupported provider')
    || message.includes('missing oauth secret')
    || message.includes('provider is not enabled')
  ) {
    return 'O login com Google ainda não está configurado. Use e-mail e senha ou conclua a configuração do Google no Supabase.';
  }

  return 'Não foi possível entrar agora. Tente novamente.';
}
