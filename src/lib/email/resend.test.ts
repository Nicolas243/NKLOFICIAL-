import assert from 'node:assert/strict';
import test from 'node:test';
import { sendGuestAccessRecoveryEmail, sendMaterialEmail, sendWelcomeEmail } from '@/lib/email/resend';

test('does not call an external provider in local preview mode', async () => {
  const originalMode = process.env.EMAIL_DELIVERY_MODE;
  process.env.EMAIL_DELIVERY_MODE = 'preview';
  let called = false;
  try {
    const result = await sendGuestAccessRecoveryEmail(
      { recipientEmail: 'buyer@example.com', accessUrl: 'http://localhost:3000/recovery' },
      async () => {
        called = true;
        throw new Error('network should not be called');
      },
    );
    assert.equal(result, 'preview');
    assert.equal(called, false);
  } finally {
    if (originalMode === undefined) delete process.env.EMAIL_DELIVERY_MODE;
    else process.env.EMAIL_DELIVERY_MODE = originalMode;
  }
});

test('sends a recovery link through Resend without exposing the API key in the payload', async () => {
  const originalMode = process.env.EMAIL_DELIVERY_MODE;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  process.env.EMAIL_DELIVERY_MODE = 'resend';
  process.env.RESEND_API_KEY = 'test-secret';
  process.env.EMAIL_FROM = 'Portal NKL <noreply@example.com>';
  try {
    let requestBody = '';
    const result = await sendGuestAccessRecoveryEmail(
      { recipientEmail: 'buyer@example.com', accessUrl: 'http://localhost:3000/recovery?a=1&b=2' },
      async (_url, init) => {
        requestBody = String(init?.body ?? '');
        return new Response('{}', { status: 200 });
      },
    );
    assert.equal(result, 'sent');
    assert.match(requestBody, /buyer@example\.com/u);
    assert.match(requestBody, /recovery/u);
    assert.equal(requestBody.includes('test-secret'), false);
  } finally {
    if (originalMode === undefined) delete process.env.EMAIL_DELIVERY_MODE;
    else process.env.EMAIL_DELIVERY_MODE = originalMode;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});

test('previews a contextual welcome email without calling an external provider', async () => {
  const originalMode = process.env.EMAIL_DELIVERY_MODE;
  process.env.EMAIL_DELIVERY_MODE = 'preview';
  let called = false;
  try {
    const result = await sendWelcomeEmail(
      {
        recipientEmail: 'new-user@example.com',
        recipientName: 'Nicolas',
        area: 'income',
        siteUrl: 'http://localhost:3000',
      },
      async () => {
        called = true;
        throw new Error('network should not be called');
      },
    );
    assert.equal(result, 'preview');
    assert.equal(called, false);
  } finally {
    if (originalMode === undefined) delete process.env.EMAIL_DELIVERY_MODE;
    else process.env.EMAIL_DELIVERY_MODE = originalMode;
  }
});

test('sends a contextual welcome email through Resend', async () => {
  const originalMode = process.env.EMAIL_DELIVERY_MODE;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  process.env.EMAIL_DELIVERY_MODE = 'resend';
  process.env.RESEND_API_KEY = 'test-secret';
  process.env.EMAIL_FROM = 'Portal NKL <noreply@example.com>';
  try {
    let requestBody = '';
    const result = await sendWelcomeEmail(
      {
        recipientEmail: 'new-user@example.com',
        recipientName: 'Nicolas',
        area: 'income',
        siteUrl: 'https://portal.example.com',
      },
      async (_url, init) => {
        requestBody = String(init?.body ?? '');
        assert.match(new Headers(init?.headers).get('Idempotency-Key') ?? '', /^welcome-email\/[a-f0-9]{64}$/u);
        return new Response('{}', { status: 200 });
      },
    );
    assert.equal(result, 'sent');
    assert.match(requestBody, /Bem-vindo/u);
    assert.match(requestBody, /Renda Extra/u);
    assert.match(requestBody, /portal\.example\.com/u);
    assert.match(requestBody, /NKL\.png/u);
    assert.match(requestBody, /\/ia/u);
    assert.match(requestBody, /\/musica\/naipe_cordas/u);
    assert.match(requestBody, /\/instalar/u);
    assert.match(requestBody, /guias\/renda-extra/u);
    assert.match(requestBody, /programas/u);
    assert.match(requestBody, /perfil/u);
    assert.equal(requestBody.includes('test-secret'), false);
  } finally {
    if (originalMode === undefined) delete process.env.EMAIL_DELIVERY_MODE;
    else process.env.EMAIL_DELIVERY_MODE = originalMode;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});

test('sends the selected material as a PDF attachment with the recipient name', async () => {
  const originalMode = process.env.EMAIL_DELIVERY_MODE;
  const originalKey = process.env.RESEND_API_KEY;
  const originalFrom = process.env.EMAIL_FROM;
  process.env.EMAIL_DELIVERY_MODE = 'resend';
  process.env.RESEND_API_KEY = 'test-secret';
  process.env.EMAIL_FROM = 'Portal NKL <noreply@example.com>';
  try {
    let requestBody = '';
    const result = await sendMaterialEmail(
      {
        recipientEmail: 'reader@example.com',
        recipientName: 'Ana',
        area: 'music',
        attachment: {
          filename: 'Grafico_de_Cordas_Online.pdf',
          content: Buffer.from('pdf-content'),
        },
      },
      async (_url, init) => {
        requestBody = String(init?.body ?? '');
        assert.match(new Headers(init?.headers).get('Idempotency-Key') ?? '', /^material-email\/[a-f0-9]{64}$/u);
        return new Response('{}', { status: 200 });
      },
    );
    const payload = JSON.parse(requestBody) as { to: string[]; subject: string; attachments: { filename: string; content: string }[] };
    assert.equal(result, 'sent');
    assert.deepEqual(payload.to, ['reader@example.com']);
    assert.match(payload.subject, /Portal Musical/u);
    assert.equal(payload.attachments[0].filename, 'Grafico_de_Cordas_Online.pdf');
    assert.equal(payload.attachments[0].content, Buffer.from('pdf-content').toString('base64'));
    assert.equal(requestBody.includes('test-secret'), false);
  } finally {
    if (originalMode === undefined) delete process.env.EMAIL_DELIVERY_MODE;
    else process.env.EMAIL_DELIVERY_MODE = originalMode;
    if (originalKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalKey;
    if (originalFrom === undefined) delete process.env.EMAIL_FROM;
    else process.env.EMAIL_FROM = originalFrom;
  }
});
