export type EmailDeliveryMode = 'preview' | 'resend';

export type GuestAccessRecoveryEmailInput = {
  recipientEmail: string;
  accessUrl: string;
};

export class EmailDeliveryError extends Error {
  readonly code = 'email_delivery_failed';

  constructor(message = 'Não foi possível enviar o e-mail de recuperação.') {
    super(message);
    this.name = 'EmailDeliveryError';
  }
}

export class MissingEmailDeliveryConfigurationError extends Error {
  readonly code = 'missing_email_delivery_configuration';

  constructor(message = 'A configuração de entrega de e-mail está incompleta.') {
    super(message);
    this.name = 'MissingEmailDeliveryConfigurationError';
  }
}

function resolveMode(): EmailDeliveryMode {
  const configured = process.env.EMAIL_DELIVERY_MODE;
  if (configured === 'preview') return 'preview';
  if (configured === 'resend') return 'resend';
  return process.env.NODE_ENV === 'production' ? 'resend' : 'preview';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendGuestAccessRecoveryEmail(
  input: GuestAccessRecoveryEmailInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();
  if (!apiKey || !from) {
    throw new MissingEmailDeliveryConfigurationError(
      'EMAIL_DELIVERY_MODE=resend requer RESEND_API_KEY e EMAIL_FROM.',
    );
  }

  const escapedUrl = escapeHtml(input.accessUrl);
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.recipientEmail],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject: 'Acesse seus materiais do Portal NKL',
      html: `<p>Seu link de acesso aos materiais personalizados está pronto:</p><p><a href="${escapedUrl}">Abrir meus materiais</a></p><p>Por segurança, este link expira em 30 dias.</p>`,
      text: `Abra seus materiais personalizados: ${input.accessUrl}\n\nPor segurança, este link expira em 30 dias.`,
    }),
  });

  if (!response.ok) throw new EmailDeliveryError();
  return 'sent';
}
