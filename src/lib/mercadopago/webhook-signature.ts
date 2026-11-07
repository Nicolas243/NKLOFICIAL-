import crypto from 'node:crypto';

const HEX_SIGNATURE = /^[a-f0-9]{64}$/i;

type SignatureParts = {
  timestamp: string;
  signature: string;
};

function parseSignature(value: string): SignatureParts | null {
  const parts = new Map(value.split(',').map((part) => {
    const [key, ...rest] = part.trim().split('=');
    return [key, rest.join('=')];
  }));
  const timestamp = parts.get('ts');
  const signature = parts.get('v1');
  if (!timestamp || !signature || !/^\d+$/.test(timestamp) || !HEX_SIGNATURE.test(signature)) return null;
  return { timestamp, signature };
}

export function verifyMercadoPagoWebhookSignature(input: {
  xSignature: string;
  xRequestId: string;
  dataId: string;
  secret: string;
}): boolean {
  const parts = parseSignature(input.xSignature);
  if (!parts) return false;
  const manifest = `id:${input.dataId};request-id:${input.xRequestId};ts:${parts.timestamp};`;
  const expected = crypto.createHmac('sha256', input.secret).update(manifest).digest('hex');
  const received = Buffer.from(parts.signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return received.length === expectedBuffer.length && crypto.timingSafeEqual(received, expectedBuffer);
}
