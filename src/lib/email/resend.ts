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

function resolveReplyTo(): string {
  return process.env.EMAIL_REPLY_TO?.trim() || 'contato@nkloficial.com.br';
}

function resolveAdminEmail(): string {
  return process.env.MATERIAL_ADMIN_EMAIL?.trim() || 'contato@nkloficial.com.br';
}

async function assertResendOk(response: Response, context: string, fallbackMessage: string): Promise<void> {
  if (response.ok) return;
  let errorCode = 'unknown';
  let errorDetail = '';
  try {
    const raw = await response.text();
    if (raw) {
      const parsed = JSON.parse(raw) as { name?: string; message?: string };
      errorCode = parsed.name ?? errorCode;
      errorDetail = parsed.message ?? raw.slice(0, 160);
    }
  } catch {
    errorDetail = response.statusText;
  }
  console.error(`[RESEND] Falha em ${context}:`, {
    status: response.status,
    code: errorCode,
    detail: errorDetail,
  });
  throw new EmailDeliveryError(fallbackMessage);
}

export async function sendGuestAccessRecoveryEmail(
  input: GuestAccessRecoveryEmailInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = resolveReplyTo();
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

  await assertResendOk(response, 'sendGuestAccessRecoveryEmail', 'Não foi possível enviar o e-mail de recuperação.');
  return 'sent';
}

export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = resolveReplyTo();
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
    logo: `${siteUrl}/NKL.png`,
    opportunities: `${siteUrl}/programas`,
    bussola: `${siteUrl}/ofertas/bussola-negocios`,
    languages: `${siteUrl}/blog/aprender/ingles`,
    languageGuides: `${siteUrl}/guias/ingles`,
    aiLab: `${siteUrl}/ia`,
    music: `${siteUrl}/musica/naipe_cordas`,
    mural: `${siteUrl}/mural-de-parceiros`,
    install: `${siteUrl}/instalar`,
    income: `${siteUrl}/guias/renda-extra`,
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
    'O Portal NKL reúne oportunidades reais de renda extra, ferramentas de IA, 6 trilhas de idiomas e conteúdo musical em um único lugar.',
    '',
    'Tudo o que você já pode explorar hoje:',
    `- Renda Extra (55+ oportunidades verificadas): ${links.opportunities}`,
    `- Bússola de Negócios (descubra seus 3 caminhos mais compatíveis): ${links.bussola}`,
    `- Idiomas com IA (Inglês, Italiano, Francês, Alemão, Espanhol e Mandarim): ${links.languages}`,
    `- Guias e E-books de Idiomas (com planner e desconto progressivo): ${links.languageGuides}`,
    `- IA na Prática & Estúdio IA: ${links.aiLab}`,
    `- NKL Cordas — Violino e Luthiers: ${links.music}`,
    `- Mural de Parceiros: ${links.mural}`,
    `- Instalar App no Celular (Portal NKL ou sub-apps por área): ${links.install}`,
    `- Guia de Renda Extra: ${links.income}`,
    `- Seu perfil e notificações: ${links.profile} | ${links.notifications}`,
    '',
    `Acesse o Portal NKL: ${links.home}`,
    '',
    'Este é um e-mail de boas-vindas transacional. Não enviamos spam nem newsletters sem sua autorização.',
  ].join('\n');
  const html = [
    '<div style="background:#090b10;margin:0;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#e2e8f0;">',
    '<div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:20px;overflow:hidden;">',
    '<div style="background:linear-gradient(135deg,#0f172a 0%,#162447 100%);padding:28px 32px;border-bottom:1px solid #1e293b;">',
    '<table role="presentation" style="width:100%;border-collapse:collapse;"><tr>',
    `<td style="width:56px;vertical-align:middle;"><img src="${escapedLinks.logo}" alt="Logo Portal NKL" width="44" height="44" style="display:block;border-radius:10px;border:1px solid rgba(255,255,255,0.18);" /></td>`,
    `<td style="vertical-align:middle;"><div style="font-size:12px;letter-spacing:2.2px;text-transform:uppercase;color:#fb923c;font-weight:bold;">Portal NKL · ${areaName}</div><h1 style="margin:6px 0 0;font-size:26px;line-height:1.2;color:#f8fafc;">Bem-vindo(a) ao seu hub prático.</h1></td>`,
    '</tr></table>',
    '</div>',
    '<div style="padding:30px 32px;">',
    `<p style="font-size:17px;margin:0 0 12px;color:#f8fafc;">Olá, <strong>${escapedName}</strong>!</p>`,
    `<p style="font-size:15px;line-height:1.65;margin:0 0 22px;color:#cbd5e1;">Sua conta no <strong>Portal NKL</strong> já está pronta. Preparamos caminhos diretos para você explorar oportunidades de renda, aprender idiomas com IA, usar inteligência artificial no dia a dia e acessar a área musical sem excesso de ruído.</p>`,
    '<h2 style="font-size:16px;text-transform:uppercase;letter-spacing:1.4px;margin:0 0 14px;color:#fb923c;">O que você encontra no Portal</h2>',
    '<table role="presentation" style="width:100%;border-collapse:separate;border-spacing:0 10px;">',
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.opportunities}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">Renda Extra (55+ oportunidades)</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Compare plataformas sem investimento inicial e modelos com investimento, filtre por idioma e salve suas favoritas.</div></td></tr>`,
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.bussola}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">Bússola de Negócios (Top 3 personalizado)</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Descubra os 3 caminhos mais compatíveis com seu tempo, capital e perfil técnico com plano de ação de 7 dias.</div></td></tr>`,
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.languages}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">Idiomas com IA (6 línguas liberadas)</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Inglês, Italiano, Francês, Alemão, Espanhol e Mandarim com guia de IA por faixa etária e planner de 90 dias. Consulte também <a href="${escapedLinks.languageGuides}" style="color:#fb923c;">os e-books completos</a>.</div></td></tr>`,
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.aiLab}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">IA na Prática & Estúdio IA</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Teste prompts prontos no laboratório, aprenda a pensar com IA e destrave aulas semanais passo a passo.</div></td></tr>`,
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.music}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">NKL Cordas — Violino & Luthiers</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Explore catálogo técnico, comparador de cordas, professores e diretório de luthiers.</div></td></tr>`,
    `<tr><td style="background:#131c31;border:1px solid #24324d;border-radius:12px;padding:14px 16px;"><a href="${escapedLinks.install}" style="color:#38bdf8;font-weight:bold;text-decoration:none;font-size:15px;">Instalar App + Mural de Parceiros</a><div style="font-size:13px;line-height:1.5;color:#cbd5e1;margin-top:4px;">Instale o <a href="${escapedLinks.install}" style="color:#38bdf8;">Portal NKL</a> ou o sub-app da sua área e acompanhe empresas em <a href="${escapedLinks.mural}" style="color:#38bdf8;">Mural de Parceiros</a> ou o <a href="${escapedLinks.income}" style="color:#38bdf8;">Guia de Renda Extra</a>.</div></td></tr>`,
    '</table>',
    `<div style="margin:24px 0 18px;"><a href="${escapedLinks.home}" style="display:inline-block;background:#f97316;color:#090b10;padding:13px 22px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:15px;">Entrar no Portal NKL agora</a></div>`,
    `<p style="font-size:13px;line-height:1.6;margin:0 0 14px;color:#94a3b8;">Ajuste seus dados em <a href="${escapedLinks.profile}" style="color:#38bdf8;">Seu perfil</a> ou ative alertas da sua área em <a href="${escapedLinks.notifications}" style="color:#38bdf8;">Notificações</a>.</p>`,
    '<p style="font-size:12px;line-height:1.5;color:#64748b;margin:18px 0 0;border-top:1px solid #1e293b;padding-top:14px;">Este é um e-mail de boas-vindas transacional enviado pelo Portal NKL. Não enviamos campanhas ou newsletters sem sua autorização.</p>',
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

  await assertResendOk(response, 'sendWelcomeEmail', 'Não foi possível enviar o e-mail de boas-vindas.');
  return 'sent';
}

export async function sendMaterialEmail(
  input: MaterialEmailInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const replyTo = resolveReplyTo();
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

  await assertResendOk(response, 'sendMaterialEmail', 'Não foi possível enviar o material.');
  return 'sent';
}

export async function sendMaterialDeliveryFailureAlert(
  input: MaterialDeliveryFailureInput,
  fetchImpl: typeof fetch = fetch,
): Promise<'preview' | 'sent'> {
  if (resolveMode() === 'preview') return 'preview';

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();
  const adminEmail = resolveAdminEmail();
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

  await assertResendOk(response, 'sendMaterialDeliveryFailureAlert', 'Não foi possível enviar o alerta administrativo.');
  return 'sent';
}
