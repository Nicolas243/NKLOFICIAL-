import assert from 'node:assert/strict';
import test from 'node:test';
import { getLoginErrorMessage } from '../errors';

test('maps invalid credentials without revealing whether the account exists', () => {
  const message = getLoginErrorMessage({ message: 'Invalid login credentials', status: 400 });
  assert.equal(message, 'E-mail ou senha inválidos.');
});

test('explains when e-mail confirmation is required', () => {
  const message = getLoginErrorMessage({ message: 'Email not confirmed', status: 400 });
  assert.equal(message, 'Confirme seu e-mail antes de entrar.');
});

test('explains rate limiting', () => {
  const message = getLoginErrorMessage({ message: 'Request rate limit reached', status: 429 });
  assert.equal(message, 'Muitas tentativas. Aguarde alguns minutos e tente novamente.');
});

test('does not expose unknown provider or server details', () => {
  const message = getLoginErrorMessage({ message: 'internal database secret', status: 500 });
  assert.equal(message, 'Não foi possível entrar agora. Tente novamente.');
  assert.equal(message.includes('internal database secret'), false);
});

test('explains when Google OAuth is not configured', () => {
  const message = getLoginErrorMessage({
    message: 'Unsupported provider: missing OAuth secret',
    status: 400,
  });
  assert.equal(
    message,
    'O login com Google ainda não está configurado. Use e-mail e senha ou conclua a configuração do Google no Supabase.',
  );
});
