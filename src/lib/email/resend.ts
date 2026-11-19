import { createHash } from 'node:crypto';

export type EmailDeliveryMode = 'preview' | 'resend';

export type GuestAccessRecoveryEmailInput = {
  recipientEmail: string;
  accessUrl: string;
};

export type WelcomeEmailInput = {
  recipientEmail: string;
  recipientName?: string | null;
  area: 'income' | 'music';
  siteUrl: string;
};

export type MaterialEmailInput = {
  recipientEmail: string;
  recipientName: string;
  area: 'income' | 'music';
  attachment: {
    filename: string;
    content: Buffer;
  };
};

export type MaterialDeliveryFailureInput = {
  recipientEmail: string;
  area: 'income' | 'music';
  errorMessage: string;
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

function idempotencyKey(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function resendHeaders(apiKey: string, key: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': key,
  };
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
    headers: resendHeaders(
      apiKey,
      `recovery-email/${idempotencyKey(`${input.recipientEmail}/${input.accessUrl}`)}`,
    ),
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

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
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

  const name = input.recipientName?.trim() || 'seja bem-vindo(a)';
  const areaName = input.area === 'income' ? 'Renda Extra' : 'Portal Musical';
  const escapedName = escapeHtml(name);
  const siteUrl = input.siteUrl.replace(/\/+$/u, '');
  const links = {
    home: siteUrl,
    opportunities: `${siteUrl}/programas`,
    income: `${siteUrl}/guias/renda-extra`,
    music: `${siteUrl}/guia-de-cordas`,
    profile: `${siteUrl}/perfil`,
    notifications: `${siteUrl}/perfil/notificacoes`,
  };
  const escapedLinks = Object.fromEntries(
    Object.entries(links).map(([key, value]) => [key, escapeHtml(value)]),
  ) as Record<keyof typeof links, string>;
  const subject = `Bem-vindo ao Portal NKL — ${areaName}`;
  const text = [
    `Olá, ${name}!`,
    '',
    `Seja bem-vindo(a) ao Portal NKL — ${areaName}.`,
    'O Portal NKL reúne oportunidades, conteúdos práticos e ferramentas para seus próximos passos.',
    '',
    'Por onde começar:',
    `- Oportunidades e programas: ${links.opportunities}`,
    `- Guia de Renda Extra: ${links.income}`,
    `- Portal Musical e guia de cordas: ${links.music}`,
    `- Seu perfil e preferências: ${links.profile}`,
    `- Notificações e lembretes: ${links.notifications}`,
    '',
    `Acesse o Portal: ${links.home}`,
    '',
    'Este é um e-mail de boas-vindas transacional. Não enviamos campanhas ou newsletters sem sua autorização.',
  ].join('\n');
  const html = [
    '<div style="background:#f4f1ea;margin:0;padding:32px 16px;font-family:Arial,sans-serif;color:#1f2933;">',
    '<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #e4ded2;border-radius:18px;overflow:hidden;">',
    '<div style="background:#102a43;padding:28px 32px;color:#ffffff;">',
    '<div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#b9d6e8;">Portal NKL</div>',
    '<h1 style="margin:10px 0 0;font-size:28px;line-height:1.15;">Seu próximo passo começa aqui.</h1>',
    '</div>',
    '<div style="padding:30px 32px;">',
    `<p style="font-size:17px;margin:0 0 14px;">Olá, ${escapedName}!</p>`,
    `<p style="line-height:1.6;margin:0 0 22px;">Seja bem-vindo(a) ao <strong>Portal NKL — ${areaName}</strong>. Reunimos oportunidades, conteúdos práticos e ferramentas para ajudar você a avançar com clareza.</p>`,
    '<h2 style="font-size:18px;margin:0 0 12px;color:#102a43;">Explore o Portal</h2>',
    `<p style="margin:10px 0;"><a href="${escapedLinks.opportunities}" style="color:#0b7285;font-weight:bold;">Oportunidades e programas</a><br><span style="color:#52606d;">Descubra caminhos de renda extra e projetos.</span></p>`,
    `<p style="margin:10px 0;"><a href="${escapedLinks.income}" style="color:#0b7285;font-weight:bold;">Guia de Renda Extra</a><br><span style="color:#52606d;">Acesse materiais e estratégias práticas.</span></p>`,
    `<p style="margin:10px 0;"><a href="${escapedLinks.music}" style="color:#0b7285;font-weight:bold;">Portal Musical</a><br><span style="color:#52606d;">Consulte o guia de cordas e conteúdos musicais.</span></p>`,
    `<p style="margin:10px 0;"><a href="${escapedLinks.profile}" style="color:#0b7285;font-weight:bold;">Seu perfil</a> · <a href="${escapedLinks.notifications}" style="color:#0b7285;font-weight:bold;">Notificações</a><br><span style="color:#52606d;">Personalize seus dados, preferências e lembretes.</span></p>`,
    `<p style="margin:26px 0 0;"><a href="${escapedLinks.home}" style="display:inline-block;background:#d97706;color:#ffffff;padding:13px 20px;border-radius:9px;text-decoration:none;font-weight:bold;">Acessar o Portal NKL</a></p>`,
    '<p style="font-size:12px;line-height:1.5;color:#697586;margin:26px 0 0;">Este é um e-mail de boas-vindas transacional. Não enviamos campanhas ou newsletters sem sua autorização.</p>',
    '</div></div></div>',
  ].join('');

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: resendHeaders(
      apiKey,
      `welcome-email/${idempotencyKey(`${input.recipientEmail}/${input.area}`)}`,
    ),
    body: JSON.stringify({
      from,
      to: [input.recipientEmail],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) throw new EmailDeliveryError('Não foi possível enviar o e-mail de boas-vindas.');
  return 'sent';
}

export async function sendMaterialEmail(
  input: MaterialEmailInput,
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

  const name = input.recipientName.trim() || 'leitor(a)';
  const areaName = input.area === 'income' ? 'Renda Extra' : 'Portal Musical';
  const escapedName = escapeHtml(name);
  const subject = `Seu material do Portal NKL — ${areaName}`;
  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: resendHeaders(
      apiKey,
      `material-email/${idempotencyKey(`${input.recipientEmail}/${input.area}/${input.attachment.filename}/${input.attachment.content.toString('base64')}`)}`,
    ),
    body: JSON.stringify({
      from,
      to: [input.recipientEmail],
      ...(replyTo ? { reply_to: replyTo } : {}),
      subject,
      html: `<p>Olá, ${escapedName}!</p><p>Conforme solicitado, enviamos seu material do <strong>Portal NKL — ${areaName}</strong> em anexo.</p><p>Esperamos que ele ajude nos seus próximos passos.</p>`,
      text: `Olá, ${name}!\n\nConforme solicitado, enviamos seu material do Portal NKL — ${areaName} em anexo.\n\nEsperamos que ele ajude nos seus próximos passos.`,
      attachments: [{
        filename: input.attachment.filename,
        content: input.attachment.content.toString('base64'),
      }],
    }),
  });

  if (!response.ok) {
    throw new EmailDeliveryError('Não foi possível enviar o material.');
  }
  return 'sent';
}

export async function sendMaterialDeliveryFailureAlert(
  input: MaterialDeliveryFailureInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const adminEmail = process.env.MATERIAL_ADMIN_EMAIL?.trim();
  if (!apiKey || !from || !adminEmail) {
    throw new MissingEmailDeliveryConfigurationError(
      'O alerta de falha requer RESEND_API_KEY, EMAIL_FROM e MATERIAL_ADMIN_EMAIL.',
    );
  }

  const response = await fetchImpl('https://api.resend.com/emails', {
    method: 'POST',
    headers: resendHeaders(
      apiKey,
      `material-failure-alert/${idempotencyKey(`${input.recipientEmail}/${input.area}/${input.errorMessage}`)}`,
    ),
    body: JSON.stringify({
      from,
      to: [adminEmail],
      subject: `Falha no envio de material — ${input.area === 'income' ? 'Renda Extra' : 'Portal Musical'}`,
      text: [
        'O envio automático de material falhou após as tentativas configuradas.',
        `Destinatário: ${input.recipientEmail}`,
        `Área: ${input.area}`,
        `Erro: ${input.errorMessage}`,
      ].join('\n'),
    }),
  });

  if (!response.ok) throw new EmailDeliveryError('Não foi possível enviar o alerta administrativo.');
  return 'sent';
}
