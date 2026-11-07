# Produto — Portal NKL

## O que é

O Portal NKL é uma plataforma brasileira para músicos, luthiers, professores e pessoas buscando oportunidades digitais. O produto combina catálogo técnico de cordas, diretórios profissionais, conteúdo editorial, recursos de conta e um catálogo público de oportunidades de renda extra.

## Públicos principais

- músicos que precisam comparar produtos e encontrar profissionais;
- luthiers, lojas e professores que desejam divulgar serviços;
- visitantes que procuram oportunidades remotas e programas de afiliados;
- administradores que moderam conteúdo, leads e assinaturas.

## Fluxos críticos

1. navegação pública da home, catálogo e conteúdo;
2. descoberta e acesso às oportunidades em `/programas`, com compatibilidade para links antigos em `/blog/renda-extra`;
3. cadastro, login e atualização de sessão pelo Supabase;
4. diretórios, leads e favoritos;
5. ações administrativas e sincronização de assinaturas;
6. checkout e webhooks, quando configurados para o ambiente.

## Restrições

- uso prioritário em celular;
- segredos apenas em variáveis de ambiente;
- validação local antes de deploy;
- mudanças de banco e produção exigem decisão explícita;
- não tratar disponibilidade ou remuneração de plataformas como garantia.

## Critérios de aceite

Uma mudança está pronta quando preserva os contratos existentes, passa a tipagem e build, tem validação focada para o fluxo alterado e não introduz segredos ou efeitos de produção não autorizados.
