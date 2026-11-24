# Padrão Oficial para Criação de Cards pela IA (`partner_programs`)

Use este padrão sempre que adicionar novas oportunidades de renda extra ou ferramentas parceiras no Portal NKL (`drizzle/*.sql`, `src/actions/partner-programs.ts` e `src/components/partner-programs-browser.tsx`).

## 1. Estrutura Obrigatória de Dados (`partner_programs`)
- `slug`: kebab-case único sem acentos (ex.: `amazon-kdp-ebooks`).
- `name`: Nome claro e verificável sem promessas irreais.
- `short_description`: 1 frase objetiva (máx. 140 caracteres) explicando O QUE se faz na prática.
- `long_description`: 2 a 4 frases diretas cobrindo como funciona, para quem serve e qual cuidado exige.
- `category`: escolher categoria coerente com os filtros (`Com investimento inicial`, `Inteligência artificial`, `Conteúdo e vídeo`, `Produtos digitais e publicação`, `Estudar e ganhar`, `Pesquisas remuneradas`, `Testes e QA`, `Afiliados`, `Renda passiva`, `Freelance`, `E-commerce e marcas`).
- `difficulty`: estritamente `'fácil' | 'médio' | 'difícil'`.
- `zero_investment_required`: `true` apenas se NÃO exigir gasto inicial para começar; `false` para qualquer trilha que exija assinatura, estoque, anúncios ou hardware pago.
- `tags`: array `jsonb` com 4 a 6 tags curtas (incluir sempre `'sem investimento'` ou `'investimento inicial'`, além de `'dólar'`, `'celular'`, `'IA'`, `'vídeo'`, `'e-books'` quando aplicável).
- `website_url` e `affiliate_url`: URL oficial da plataforma; deixar `affiliate_url = NULL` se não houver programa direto aprovado, nunca inventar código de indicação.
- `editorial_rating`: inteiro de `1` a `10` honesto com base em previsibilidade, histórico e transparência.
- `status`: sempre `'published'`.
- `pros` (3 itens), `cons` (3 itens), `requirements` (3 itens), `payment_methods` (ex.: `["Pix", "Wise", "PayPal"]`) e `earning_potential`: obrigatórios.

## 2. Padrão Visual e de Botões no Card (`PartnerProgramsBrowser`)
- **Topo:** Categoria (uppercase `text-neon`) + Título (`font-playfair`) à esquerda; Pílula `averageEarning` + Nota comunitária/editorial (`X.X/10`) à direita.
- **Idiomas:** Badges com `Português` / `Inglês` / `Espanhol` / `Chinês`.
- **Descrição & Tags:** `shortDescription` com expansão opcional acima de 150 chars + pílula de `difficulty` + tag `Pode pagar em dólar` + `SmartTagList` + logo quadrado `64x64` (`public/partner-logos/*` ou favicon em alta resolução via Google S2 `sz=256`).
- **Ações inferiores (ordem fixa):**
  1. `Ler mais` (abre modal com detalhes completos, vídeos e avaliações)
  2. CTA primário `Acessar plataforma` (`OutboundLink` com `rel="sponsored"` quando `affiliateUrl` existir)
  3. `Salvar` (`SaveProgramButton`)
  4. `Compartilhar` (`Share2`)
  5. `Lembrar` (`BellPlus` -> Google Calendar / `.ics`)

## 3. Política de Afiliados Diretos e Complementares
Quando uma plataforma principal não tiver link de afiliado direto, recomenda-se sugerir no bloco de apoio ferramentas complementares legítimas com programa de afiliados aberto (consulte [MAPA-AFILIADOS-50-OPORTUNIDADES.md](./MAPA-AFILIADOS-50-OPORTUNIDADES.md)):
- Recebimento internacional: **Wise** / **Payoneer**
- Design e criação: **Canva** / **CapCut** / **OpusClip** / **HeyGen** / **ElevenLabs**
- Automação e loja: **Make** / **Printful** / **Hostinger** / **Amazon Associados**
- Hardware de estudo/gravação: **Amazon Associados** / **Mercado Livre** / **Shopee**

## 4. Checklist Pré-Publicação (Zero Defeitos)
- [ ] Zero emojis e zero promessas de ganho garantido.
- [ ] Logo carregando sem `404` (local em `public/partner-logos/` ou URL válida).
- [ ] Meta adicionada em `PROGRAM_EDITORIAL_META` (`src/actions/partner-programs.ts`) e nas tags de descoberta (`DISCOVERY_TAGS`).
- [ ] Passa em `npm run verify` (`lint`, `typecheck`, `next build`).
