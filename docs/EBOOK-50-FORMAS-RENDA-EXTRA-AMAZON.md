# Blueprint do Livro Amazon KDP: 57 Formas Práticas de Construir Renda Extra

Este documento descreve o gerador modular e os artefatos completos do livro **Portal NKL** para publicação simultânea na **Amazon KDP** em formato **Digital (Kindle EPUB 3.0)** e **Físico (Paperback 6x9" com miolo PDF + capa completa com lombada exata)**.

---

## Estrutura Editorial (12 Capítulos + Apêndice em 3 Partes)

- **Parte I — Fundamentos, Matemática Real e Blindagem:**
  - *Prefácio e Guia de Uso:* por que este livro substitui listas rasas por execução verificada + diferença entre versão Kindle e caderno impresso.
  - *Capítulo 1 — A Matemática Real da Renda Extra:* fórmula de Hora Líquida Real (HLR), Os 4 Quadrantes do Retorno Digital e teto semanal sustentável.
  - *Capítulo 2 — Infraestrutura Profissional no Brasil (Reais, Dólar e Euro):* comparação Wise/Payoneer/PayPal/Deel, redução de spread, higiene digital operacional e organização fiscal (Carnê-Leão e MEI).
  - *Capítulo 3 — Validação em 14 Dias e Escudo Anti-Golpe:* 12 sinais objetivos de fraude, triagem em 5 passos, matriz Parar/Ajustar/Escalar e **Ficha Pautada de Bússola Pessoal**.
- **Parte II — Enciclopédia Prática das 57 Formas Verificadas (Capítulos 4 a 9):**
  - *Capítulo 4:* IA, Treinamento de Modelos e Pesquisas Remuneradas
  - *Capítulo 5:* Testes de Apps, QA, UX e Entrevistas B2B
  - *Capítulo 6:* Conteúdo UGC, Vídeos Curtos, Áudio e Economia de Criadores
  - *Capítulo 7:* Freelancing Global, Ensino e Desafios Técnicos
  - *Capítulo 8:* Afiliados, Indicações, Marketplaces e Renda Complementar
  - *Capítulo 9:* Produtos Digitais, Amazon KDP e Modelos com Investimento Inicial
  - Cada item traz: **Raio-X Rápido, Como Funciona na Prática, Roteiro do Primeiro Saque (7–14 dias), Pontos Fortes vs. Cuidados, Erros de Reprovação/Banimento, Ferramentas de Apoio e Prompt de IA Aplicado** (+ diário pautado de capítulo na versão física).
- **Parte III — Do Extra ao Negócio Próprio (Capítulos 10 a 12 + Apêndice):**
  - *Capítulo 10:* Os **18 Modelos de Negócio da Bússola** com estrutura comercial de 3 opções, conquista do 1º cliente sem anúncios pagos e plano de 7 dias.
  - *Capítulo 11:* Biblioteca com **25 Prompts Prontos de IA** em 5 grupos + guia funcional de inglês/idiomas para ganhar em dólar.
  - *Capítulo 12:* Plano Mestre de **30, 60 e 90 Dias** + Caderno Físico Completo (Diário 14 Dias, Rastreador 30 Dias, Fechamento Mensal e páginas pautadas).
  - *Apêndice:* Glossário prático e guia dos catálogos vivos em `nkloficial.com.br`.

---

## Como Gerar e Arquivos Produzidos

```powershell
npm run amazon:book
```

Arquivos gravados automaticamente em `private-assets/amazon-book/` (fora do git público):
1. **Edição Digital Kindle (EPUB 3.0 + NCX):** `private-assets/amazon-book/57-formas-renda-extra-kindle.epub` (e prévia HTML `57-formas-renda-extra-kindle.html`)
2. **Capa Digital Kindle:** `private-assets/amazon-book/capa-kindle-1600x2560.jpg` (1600x2560 RGB JPEG)
3. **Edição Física Paperback 6x9" (PDF Pronto p/ Impressão):** `private-assets/amazon-book/57-formas-renda-extra-paperback-6x9.pdf` (margens espelhadas com gutter KDP e numeração automática pós-folhas iniciais)
4. **Capa Completa Física (Frente + Lombada Exata + Contracapa + Caixa ISBN):** `private-assets/amazon-book/capa-paperback-6x9-completa.pdf`
5. **Metadados & Passo a Passo de Publicação:** `private-assets/amazon-book/KDP-METADADOS-E-PUBLICACAO.md`
