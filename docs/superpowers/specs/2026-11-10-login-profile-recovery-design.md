# Recuperação do login e identidade do usuário

## Intenção

Fazer o login do Portal NKL revelar a causa real das falhas, manter o fluxo
de e-mail/senha utilizável e garantir que um login OAuth bem-sucedido tenha
um perfil vinculado ao mesmo `auth.users.id`, incluindo o nome fornecido pelo
provedor.

## Objetivos

- Traduzir erros conhecidos de autenticação em mensagens úteis sem expor
  segredos ou detalhes internos.
- Preservar a criação e atualização de `user_profiles` para usuários legados.
- Sincronizar nome e e-mail do usuário autenticado no callback OAuth.
- Manter `/perfil` como área de perfil existente e o botão do cabeçalho
  apontando para ele quando houver sessão.

## Fora do escopo

- Configurar credenciais OAuth no painel do Supabase ou Google Cloud.
- Alterar senhas, apagar usuários ou modificar dados existentes.
- Criar uma nova área visual de perfil ou reformular a navegação.
- Implementar o provedor Facebook, que é uma configuração independente.

## Abordagens consideradas

1. **Corrigir apenas a configuração do Supabase**: resolveria o OAuth, mas
   continuaria escondendo erros de senha e não garantiria a sincronização do
   perfil.
2. **Desativar OAuth e manter somente senha**: reduziria o erro imediato, mas
   removeria uma opção desejada e não corrigiria a identidade do usuário.
3. **Corrigir diagnóstico e sincronização no código** (escolhida): resolve o
   que o aplicativo controla e deixa explícito que credenciais OAuth faltantes
   precisam ser corrigidas no Supabase.

## Desenho

- Extrair a garantia de perfil para uma função reutilizável no fluxo de
  autenticação.
- No login por senha, mapear erros de credenciais, confirmação de e-mail e
  rate limit para mensagens específicas.
- No callback, trocar o código, ler o usuário autenticado e fazer upsert do
  perfil usando `user.user_metadata.full_name` como nome inicial, sem
  substituir um nome de perfil já preenchido.
- Validar com testes focados e depois executar `npm run verify`.

