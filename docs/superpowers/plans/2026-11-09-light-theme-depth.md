# Profundidade do tema claro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar no tema claro a profundidade do fundo do tema escuro e separar visualmente os cards do background.

**Architecture:** Reutilizar o parallax já montado em `ParallaxBackground`; ajustar apenas as variáveis e regras globais em `globals.css`, com seletores base para o claro e sobrescritas `.dark` preservando o escuro. A mudança será feita sem alterações em páginas ou componentes de conteúdo.

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, CSS custom properties.

**Spec:** `docs/superpowers/specs/2026-11-09-light-theme-depth-design.md`

## Global Constraints

- Preservar o stack Next.js 16, React, Drizzle, Supabase e Tailwind.
- Usar as variáveis já existentes em `src/app/globals.css`; não duplicar lógica em páginas individuais.
- Preservar o visual escuro aprovado.
- Não alterar conteúdo, layout ou comportamento do seletor de tema.

## Review Focus

- Tema claro em viewport mobile: gradientes e camadas não devem causar overflow horizontal nem dificultar leitura.
- Tema escuro após a alteração: cores e contraste atuais devem permanecer equivalentes.
- Cards sobre o parallax: superfície, borda e sombra devem manter separação sem parecerem opacos demais.
- Movimento reduzido: `prefers-reduced-motion` deve continuar removendo a animação das camadas.
- Componentes globais fora das páginas principais: header, footer e formulários devem continuar usando as variáveis de superfície.

---

### Task 1: Harmonizar fundo e superfícies do tema claro

**Files:**
- Modify: `src/app/globals.css:7-35, 122-170, 260-305, 390-410`
- Test: validação visual em `/programas` e `/` nos viewports mobile e desktop; `npm run lint`, `npm run typecheck`, `npm run build`

**Interfaces:**
- Consumes: variáveis `--background`, `--surface`, `--income-background`, `--income-surface`, `--income-card`, `--border`, `--neon` e `--orange`; classes de parallax existentes em `ParallaxBackground`.
- Produces: fundo claro com gradiente/atmosfera equivalente ao escuro e cards claros claramente separados por superfície, borda e sombra.

- [ ] **Step 1: Capturar a baseline visual e estrutural**

Abrir `/programas` e `/` no tema claro e escuro, em 390px e desktop, registrando que o claro está plano e que os cards se misturam. Rodar `npm run lint` e `npm run typecheck` para confirmar que a baseline não tem falhas novas.

- [ ] **Step 2: Ajustar as variáveis claras**

Em `src/app/globals.css`, substituir a base clara neutra/bege por uma escala clara fria alinhada ao azul neon e laranja do tema escuro: o `--background` deve permanecer luminoso, `--surface` deve ser branco levemente azulado, e `--border` deve ganhar contraste suficiente para delimitar cards. Manter as variáveis `.dark` sem mudança funcional.

- [ ] **Step 3: Adicionar profundidade ao parallax claro**

Atualizar apenas as regras base de `.music-parallax-field`, `.music-parallax-notes`, `.music-parallax-staves`, `.music-parallax-particles`, `.income-parallax-field`, `.income-parallax-dots`, `.income-parallax-glow` e `.income-parallax-particles` para que o claro exiba gradientes radiais, linhas e partículas em baixa opacidade. As regras `.dark` devem continuar fornecendo o contraste próprio do escuro.

- [ ] **Step 4: Separar cards claros do fundo**

Trocar sombras hard-coded dependentes de fundo claro por sombras e bordas baseadas nas variáveis do tema, garantindo que os seletores globais de cards e superfícies tenham uma camada visual distinta tanto no portal musical quanto no portal de renda extra.

- [ ] **Step 5: Verificar os critérios visuais e responsivos**

Revisar `/programas` e `/` nos quatro cenários (claro/escuro e mobile/desktop), confirmando gradiente, parallax, separação dos cards, ausência de overflow e leitura dos textos. Confirmar também que `prefers-reduced-motion: reduce` mantém as camadas estáticas.

- [ ] **Step 6: Executar as verificações do projeto**

Run: `npm run lint`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS.
