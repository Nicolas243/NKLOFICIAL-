# Checklist Offline — Portal NKL (Contas de Afiliado, E-mail e Publicacao)

Guia direto para tudo o que depende de login pessoal ou browser fora do codigo.
O catalogo completo de mapeamento dos 55 cards tambem esta em `docs/MAPA-AFILIADOS-50-OPORTUNIDADES.md`.

---

## Como atualizar os links depois de criar as contas

1. Acesse `https://nkloficial.com.br/admin` logado como administrador.
2. Abra a aba **Programas** (ou edite direto na tabela `partner_programs.referral_url` no Supabase) e cole seu link/codigo de indicacao em cada card correspondente.
3. Os links de marketplace em `src/components/partner-programs-browser.tsx` (`MARKETPLACE_AFFILIATE_LINKS`) tambem podem receber seu ID de afiliado direto quando quiser substituir os links oficiais de cadastro pelos seus links curtos com tag.

---

## Prioridade 1 — Afiliados de Maior Retorno (Abrir Conta Hoje)

Esses programas convertem melhor porque quase todo visitante de renda extra, freelancer ou vendedor precisa de conta em dolar, loja ou equipamentos:

| Programa | Para que serve nos cards | URL oficial para criar conta / pegar link |
|---|---|---|
| **Wise (Indicação USD/EUR)** | Receber em dolar/euro sem taxas abusivas (Outlier, Micro1, DataAnnotation, Upwork, Amazon KDP) | https://wise.com/invite |
| **Payoneer Partners** | Conta global obrigatoria para Walmart Marketplace, Printful e freelancing internacional | https://www.payoneer.com/partners/ |
| **Amazon Associados Brasil** | Livros, microfones USB, webcams, suportes, notebooks e ebooks impressos/Kindle | https://associados.amazon.com.br/ |
| **Mercado Livre Afiliados** | Iluminacao ring light, tripes, celulares e acessorios para UGC e e-commerce | https://www.mercadolivre.com.br/l/afiliados-home |
| **Shopee Afiliados** | Produtos virais, microfones de lapela e kits iniciais baratos | https://affiliate.shopee.com.br/ |
| **Influenciador Magalu** | Loja propria curada de eletronicos e equipamentos | https://www.magazinevoce.com.br/ |
| **Hotmart Afiliados** | Produtos digitais, treinamentos complementares e infoprodutos | https://hotmart.com/pt-br/afiliados |
| **AliExpress Portals** | Fornecedores globais, dropshipping e equipamentos acessiveis | https://portals.aliexpress.com/ |

---

## Prioridade 2 — Afiliados Recorrentes B2B / SaaS / Ferramentas de IA (20% a 60% por indicacao)

Ferramentas recomendadas junto aos cards de IA, automacao, criacao de video, lojas e templates:

| Ferramenta / Programa | Comissao media / Uso nos cards | URL oficial para cadastro |
|---|---|---|
| **Systeme.io Affiliate** | ~60% recorrente em funis, comunidades e paginas de venda | https://systeme.io/affiliate-program |
| **Fiverr Affiliates** | CPA / RevShare para quem contrata ou oferece servicos digitais | https://affiliates.fiverr.com/ |
| **Make Partners** | ~20% recorrente em automacoes com IA para negocios locais | https://www.make.com/en/partners |
| **Printful Affiliate** | ~10% recorrente em lojas Print on Demand globais | https://www.printful.com/affiliates |
| **OpusClip Affiliate** | ~25% recorrente para criadores de cortes virais com IA | https://www.opus.pro/affiliate |
| **HeyGen Affiliate** | Avatares e videos com IA sem aparecer | https://www.heygen.com/affiliate-program |
| **ElevenLabs Affiliates** | Narracao realista e dublagem para canais dark / aulas | https://elevenlabs.io/affiliates |
| **Hostinger Affiliates** | Hospedagem de sites, landing pages e lojas (ate 60% primeira compra) | https://www.hostinger.com.br/afiliados |
| **Canva Affiliates** | Design, ebooks, templates e capas digitais | https://www.canva.com/affiliates/ |
| **TubeBuddy Affiliates** | SEO para canais YouTube / Dark + NotebookLM (20%–30% recorrente) | https://www.tubebuddy.com/affiliates |
| **Metricool Affiliate** | Agendamento de redes sociais e gestao de trafego/UGC | https://metricool.com/affiliate-program/ |
| **Montink Embaixador** | Print on Demand no Brasil sem estoque | https://montink.com/ |

---

## Prioridade 3 — Plataformas Diretas de Renda Extra & Marketplaces Extras

| Plataforma | Observacao | URL oficial |
|---|---|---|
| **Micro1** | Pegar seu link proprio de referral no painel | https://www.micro1.ai/ |
| **Outlier AI** | Validar conta e ativar convite de parceiro | https://outlier.ai/ |
| **Claru IA** | Link NKL ativo (`?ref=yzv3jv9q&mode=partner`) — acompanhar painel | https://app.claru.ai/ |
| **Nyte-X** | Codigo NKL ativo (`/r/NICDSZ3`) — acompanhar painel | https://nyte-x.com/ |
| **QuintoAndar Indica Ai** | Indicacao paga de imoveis para aluguel/venda | https://www.quintoandar.com.br/indica-ai |
| **Honeygain / Pawns.app / Repocket** | Compartilhamento passivo de banda | https://www.honeygain.com/ / https://pawns.app/ / https://repocket.com/ |
| **Walmart Marketplace & Affiliates** | Revenda e indicacoes Walmart EUA | https://marketplace.walmart.com/ / https://affiliates.walmart.com/ |
| **eBay / Etsy / Shein / Temu** | Programas globais complementares | https://partnernetwork.ebay.com/ / https://www.etsy.com/affiliates / https://affiliate.shein.com/ / https://www.temu.com/affiliate_recruit.html |
| **Grass / Toloka** | IA remunerada / curadoria de dados | https://www.getgrass.io/ / https://toloka.ai/ |
| **Buy Me a Coffee** | Convite ativo (`invite/ni2co3san9c`) — acompanhar painel | https://www.buymeacoffee.com/ |

---

## Infraestrutura & Publicacao Offline (Passo a Passo)

### 1. Cloudflare Email Routing (`@nkloficial.com.br`)
- Roteiro detalhado em `docs/GUIA-CLOUDFLARE-EMAIL-E-NOTEBOOKLM.md`.
- Resumo rapido:
  1. Abrir painel Cloudflare -> selecionar `nkloficial.com.br` -> **Email** -> **Email Routing** -> **Enable**.
  2. No Registro.br, apontar os Nameservers para a Cloudflare mantendo obrigatoriamente os registros A/CNAME da Vercel e os registros `send` (DKIM/SPF/MX) do Resend exatamente como estao antes de trocar o NS.
  3. Criar `contato@nkloficial.com.br` (e se quiser separar por area depois: `suporte@`, `parceiros@`, `idiomas@`) encaminhando para o seu Gmail pessoal.
  4. Para responder usando `@nkloficial.com.br` pelo Gmail: **Configuracoes -> Contas e importacao -> Enviar e-mail como -> Adicionar endereco** usando SMTP `smtp.resend.com`, porta `465`, usuario `resend` e senha = sua `RESEND_API_KEY`.

### 2. Publicar o Livro "50 Formas Reais de Renda Extra" na Amazon KDP
1. Abrir https://kdp.amazon.com/ e fazer login na sua conta Amazon.
2. Escolher **+ Criar -> eBook Kindle**: usar o arquivo ja gerado em `private-assets/amazon-book/50-formas-renda-extra-kindle.html` (importar direto ou converter via Kindle Create / Calibre se preferir `.kpf`/`.epub`).
3. Escolher **Criar livro com capa comum (Paperback)** no formato **6 x 9 polegadas (15,24 x 22,86 cm)**: abrir `private-assets/amazon-book/50-formas-renda-extra-impresso-6x9.html` no Google Chrome, pressionar `Ctrl+P`, escolher **Salvar como PDF** com margens padrao e sem cabecalhos/rodapes, e subir esse PDF no KDP.
4. Subir capa personalizada (feita no Canva ou gerador de capa KDP) e definir preco e territorios (KDP Select opcional).

### 3. Gerar Aulas em Audio Progressivas com NotebookLM
1. Abrir https://notebooklm.google.com/ e criar 1 caderno por trilha (Ex.: `IA na Pratica - Semana 1 a 4`, `Ingles com IA`, `Renda Extra`).
2. Alimentar cada caderno com os guias e checklists de `private-assets/` e `docs/`.
3. Gerar **Audio Overview** para cada modulo semanal e baixar o arquivo de audio (converter para MP3 64–96 kbps).
4. Subir os audios no bucket privado `guide-assets-private` (Supabase Storage) ou no **Cloudflare R2** (10 GB gratuitos/mes sem custo de egress) e registrar os caminhos/modulos nas entregas semanais em `src/lib/ai-course.ts`.

### 4. Itens Opcionais (Nao impedem vender hoje)
- **Web Push nativo no navegador (VAPID):** Hoje a captura por sub-app (`app_scope`) e o envio no `/admin` ja funcionam no banco. Se quiser disparar notificacoes nativas mesmo com o site fechado, rode `npx web-push generate-vapid-keys` e adicione `NEXT_PUBLIC_VAPID_PUBLIC_KEY` e `VAPID_PRIVATE_KEY` nas variaveis de ambiente da Vercel.
- **Stripe CLI local:** A producao na Vercel ja esta 100% Live (`acct_1UZsOzQzOKRNmIif` + webhook `we_1Uf9wpQzOKRNmIifj8PgQnwE`). Caso queira testar eventos na sua maquina local outro dia, execute `stripe login`.
- **Supabase Leaked Password Protection:** Recurso exclusivo do plano Pro do Supabase; nao disponivel no plano Free atual.
