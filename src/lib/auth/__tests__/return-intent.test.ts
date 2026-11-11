import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLoginPath,
  buildReturnPath,
  parseGuideResumeIntent,
} from '../return-intent';

test('builds a purchase login path with a validated local destination', () => {
  assert.equal(
    buildLoginPath('/guias/renda-extra', 'purchase'),
    '/login?next=%2Fguias%2Frenda-extra&resume=purchase',
  );
});

test('builds a subscription return path with a validated local destination', () => {
  assert.equal(
    buildReturnPath('/guias/renda-extra', 'subscription'),
    '/guias/renda-extra?resume=subscription',
  );
});

test('rejects unsafe destinations and unknown resume intents', () => {
  assert.equal(buildLoginPath('//evil.example', 'purchase'), '/login?next=%2F&resume=purchase');
  assert.equal(buildReturnPath('/\\evil.example', 'subscription'), '/?resume=subscription');
  assert.equal(parseGuideResumeIntent('checkout'), null);
  assert.equal(parseGuideResumeIntent(null), null);
});
