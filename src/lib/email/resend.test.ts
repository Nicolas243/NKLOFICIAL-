import assert from 'node:assert/strict';
import test from 'node:test';
import { sendGuestAccessRecoveryEmail } from '@/lib/email/resend';

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
