# Blueprint do Livro Amazon KDP: 50 Formas Práticas de Construir Renda Extra

Este documento estrutura a edição completa do livro **Portal NKL** para publicação simultânea na **Amazon KDP** em dois formatos gerados pelo script [build-amazon-book.ts](../scripts/build-amazon-book.ts):
1. **Edição Kindle (eBook Reflowable HTML):** `private-assets/amazon-book/50-formas-renda-extra-kindle.html`
2. **Edição Impressa Paperback 6x9" (PDF / Impressão via navegador):** `private-assets/amazon-book/50-formas-renda-extra-impresso-6x9.html`

## Estrutura Editorial do Livro (50+ Formas Reais em 7 Capítulos)
- **Introdução:** Como ler oportunidades sem cair em golpes, como separar renda por hora vs. renda escalável e o método de validação em 14 dias.
- **Capítulo 1 — Treinamento de IA, Dados e Pesquisas (0 Investimento):** Micro1, Outlier AI, DataAnnotation, Claru IA, Mindrift, Prolific, Dscout, OneForma, Crowtado, SERP Raters, Grass/Toloka.
- **Capítulo 2 — Testes de Apps, QA e UX Remoto (0 Investimento):** uTest, Testlio, Alligner, Testes UX Narrados, Entrevistas B2B (Respondent / User Interviews), Clickworker, AttaPoll, Nyte-X.
- **Capítulo 3 — Conteúdo, UGC e Economia de Criadores:** Billo, JoinBrands, UGC Roster, Creator Space, AppHub, Fluencify, Flambra, Hub, TikTok Shop, Bilibili, Canal Dark + NotebookLM.
- **Capítulo 4 — Freelancing, Ensino e Serviços Especializados:** Fiverr, Upwork, Aulas e Mentoria Prática, Edição de Cortes Virais com IA, Estudar e Ganhar (Kaggle / Bug Bounties).
- **Capítulo 5 — Afiliados, Indicações e Curadoria de Nicho:** Amazon Associados & Influencer, Marketplaces (Shopee / ML / Magalu), Hotmart, QuintoAndar Indica Aí, Mercado Pago, SideShift, Afiliados B2B (Make/TubeBuddy), Redes CPA, Monetização Web, Renda Passiva (Honeygain / Repocket / Pawns.app).
- **Capítulo 6 — Produtos Digitais, Amazon KDP e Negócios com Investimento Inicial:** Amazon KDP (eBook & Impresso), Gumroad/Etsy Templates, Printful/Montink (POD), Walmart Marketplace Revenda & Arbitragem, Automação/IA para Negócios Locais, Gestão de Tráfego Pago Local, Comunidades Pagas (Skool/Systeme), Produção de Vídeos com IA.
- **Capítulo 7 — Fechamento Prático:** Checklist anti-reprovação, controle tributário básico, como receber em USD/EUR pagando menos taxas e plano de ação de 30 dias.

## Como Gerar Novamente e Publicar na Amazon KDP
```powershell
npx tsx scripts/build-amazon-book.ts
```
- **Para Kindle:** suba `50-formas-renda-extra-kindle.html` no KDP (ou converta em EPUB via Calibre / Kindle Previewer 3 gratuito da Amazon).
- **Para Livro Físico (Paperback 6x9"):** abra `50-formas-renda-extra-impresso-6x9.html` no Chrome/Edge -> `Ctrl+P` -> **Salvar como PDF** (Margem: Padrão / Papel: custom 6x9 pol. / Sem cabeçalhos do navegador) e faça upload do PDF de miolo no KDP Paperback.
