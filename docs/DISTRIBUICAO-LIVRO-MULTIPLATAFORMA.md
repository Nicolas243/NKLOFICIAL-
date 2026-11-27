# Distribuição Multiplataforma do Livro — Portal NKL

Este guia resume a operação de publicação do livro **57 Formas Práticas de Construir Renda Extra** fora da Amazon, com arquivos gerados em `private-assets/book-multiplatform/`.

## Regra Central: Físico Livre Hoje vs. KDP Select (90 Dias)

- **Livro físico (impresso):** o contrato do KDP Select aplica-se **somente ao e-book digital**. Voce pode publicar e vender a edição impressa na **UICLAP** e no **Clube de Autores** imediatamente, sem violar nenhuma regra da Amazon.
- **e-Book digital (EPUB / PDF):** enquanto o e-book estiver ativo no **KDP Select** (Amazon), e proibido vende-lo ou distribui-lo digitalmente em outras lojas ou checkout próprio.
  - Para liberar a distribuição digital ampla: desmarque a renovação automática do KDP Select no painel Amazon KDP e aguarde o fechamento do ciclo vigente de **90 dias**.

## Mapa das 5 Pastas Geradas

Cada pasta em `private-assets/book-multiplatform/` traz os binários finais e um arquivo `METADADOS-*.md` ou `COPY-*.md` com textos e configurações prontas:

| Pasta | Canal | Arquivos Prontos | Status KDP Select |
| --- | --- | --- | --- |
| `01-uiclap-fisico/` | UICLAP (Brasil POD 16 x 23 cm) | Miolo PDF 16x23cm, Capa Completa PDF (sem caixa KDP), `METADADOS-UICLAP.md` | **Liberado hoje** |
| `02-clube-de-autores/` | Clube de Autores + Mercado Livre + Estante Virtual + Americanas + Amazon Marketplace | Miolo PDF 16x23cm, Capa Completa PDF, Capa JPG, EPUB, `METADADOS-CLUBE-DE-AUTORES.md` | **Físico liberado hoje** (desmarcar e-book se KDP Select estiver ativo) |
| `03-google-play-livros/` | Google Play Livros | EPUB 3.0, Capa JPG 1600x2560, `METADADOS-GOOGLE-PLAY.md` | Aguardar fim dos 90 dias do KDP Select |
| `04-draft2digital-apple-kobo-global/` | Apple Books, Kobo, Barnes & Noble, Everand, Tolino, OverDrive | EPUB 3.0, Capa JPG 1600x2560, `METADADOS-DRAFT2DIGITAL.md` | Aguardar fim dos 90 dias do KDP Select |
| `05-venda-direta-hotmart-portal-nkl/` | Hotmart, Kiwify, Eduzz, Portal NKL | PDF colorido em tela (A5), EPUB 3.0, Capa JPG, `COPY-VENDA-DIRETA.md` | Aguardar fim dos 90 dias do KDP Select |

## Orientação de ISBN no Brasil (Próprio vs. Gratuito da Loja)

1. **ISBN próprio via Câmara Brasileira do Livro (`https://www.cblservicos.org.br`):**
   - Recomendado se voce quiser controlar a ficha catalográfica e manter o mesmo selo editorial (**Portal NKL**) unificado nas lojas brasileiras e internacionais.
   - Requer cadastro de autor/editor independente na CBL e emissão de **1 ISBN para o formato impresso** e **1 ISBN separado para o formato digital (EPUB/PDF)**.
   - Para envio na UICLAP/Clube de Autores, a contracapa gerada ja esta livre da caixa branca da Amazon, permitindo o posicionamento limpo do código de barras da loja ou do seu ISBN.
2. **ISBN / identificador gratuito por plataforma:**
   - **Amazon KDP:** fornece ASIN (e-book) e ISBN gratuito opcional (paperback, valido apenas na KDP).
   - **UICLAP / Clube de Autores:** permitem publicar com registro interno/gratuito ou ISBN proprio informado no painel.
   - **Google Play Livros:** gera identificador `GGKEY` gratuito caso voce nao informe ISBN.
   - **Draft2Digital:** fornece ISBN gratuito de autopublicação para Apple Books, Kobo e parceiros (ou aceita o seu ISBN proprio da CBL).

## Comando de Regeneração

Sempre que houver atualização nos dossiês (`partner_programs`), nos modelos da Bússola de Negócios (`business_profiles`) ou nos capítulos do livro, execute:

```bash
npm run book:multiplatform
```

Ou diretamente via `tsx`:

```bash
npx tsx scripts/build-book-multiplatform.ts
```
