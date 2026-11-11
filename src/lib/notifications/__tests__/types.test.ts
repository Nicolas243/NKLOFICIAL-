import assert from 'node:assert/strict';
import test from 'node:test';
import { getNotificationHref, getNotificationLabel } from '../types';

test('maps known notification types to safe labels and internal links', () => {
  const relatedId = '123e4567-e89b-12d3-a456-426614174000';
  assert.equal(getNotificationLabel('review_received'), 'Avaliação');
  assert.equal(getNotificationHref('review_received', relatedId), `/luthiers/${relatedId}`);
  assert.equal(getNotificationHref('system_alert', relatedId), '/perfil/notificacoes');
});

test('does not create a related link without a valid id', () => {
  assert.equal(getNotificationHref('lead_received', null), '/perfil/notificacoes');
  assert.equal(getNotificationHref('lead_received', 'not-an-id'), '/perfil/notificacoes');
});
