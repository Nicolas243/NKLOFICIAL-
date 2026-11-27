# Mapa Temático SEO/GEO — Portal NKL (Uso Interno)

Documento interno de referência editorial e técnica (não publicado como página do site). Organiza as lacunas reais de busca em português (PT-BR) nas duas principais verticais do Portal NKL e associa cada intenção de busca à rota canônica onde a resposta original e verificada está publicada.

---

## 1. Política de Originalidade e Rejeição de Conteúdo Raspado

Copiar, raspar ou republicar resultados de busca do Google (SERPs, People Also Ask, trechos de terceiros ou páginas espelhadas) dentro do domínio é estritamente rejeitado pelas políticas de spam do Google:

- **Scraped Content & Scaled Content Abuse (Google Spam Policies):** Páginas geradas para espelhar resultados de busca ou parafrasear respostas existentes sem dados próprios, verificação primária ou experiência real perdem indexação e podem derrubar a autoridade de todo o domínio.
- **Doorway Pages e Thin Content:** Criar dezenas de URLs quase idênticas apenas variando palavras-chave de cauda longa sem utilidade distinta prejudica rastreamento e conversão.
- **Padrão Portal NKL (E-E-A-T e GEO):** Toda URL deve entregar valor verificável — dados estruturados do catálogo em Postgres, percentuais calculados ao vivo (`CatalogStatsBox`), critérios públicos de checagem (`/metodologia`), comparações diretas ou ferramentas interativas (como a Bússola de Negócios).

---

## 2. Vertical: Renda Extra e Economia Digital (PT-BR)

| Lacuna Temática em PT-BR | O que o usuário brasileiro precisa resolver | Rota Canônica no Portal NKL | Evidência e Entregável Original |
| --- | --- | --- | --- |
| **MEI/CNPJ vs. Pessoa Física (Carnê-Leão / IRPF)** | Saber quando receber como PF via Carnê-Leão ou abrir MEI para serviços digitais, treinamento de IA e pagamentos recorrentes do exterior | `/programas` e `/guias/renda-extra` | Orientações práticas por modelo de atuação, limites e alertas tributários sem jargão jurídico |
| **Checagem antifraude em 3 minutos** | Identificar golpes de "tarefa paga com depósito via Pix", taxas escondidas e falsos apps antes de cadastrar dados | `/metodologia` e `/programas` | Os 5 portões de verificação, política de cobrança zero na entrada e sinais práticos de alerta |
| **Comparação real entre modelos de renda** | Entender esforço, tempo de retorno, idioma e risco entre microtarefas, treinamento de IA, testes de usabilidade, UGC e serviços digitais | `/programas`, `/programas/[slug]` e `/ofertas/bussola-negocios` (`/quiz-negocios`) | Tabela comparativa, fichas individuais com prós/contras, notas híbridas e Bússola de Negócios por perfil |
| **Trilhos de saque em dólar (USD para BRL)** | Descobrir quais plataformas pagam em USD para brasileiros via PayPal, Wise ou Payoneer e quais exigem inglês ou conta internacional | `/programas` e `/programas/[slug]` | Filtros por moeda e método de saque, percentuais ao vivo em `CatalogStatsBox` e requisitos por plataforma |

---

## 3. Vertical: Cordas de Violino e Luteria (PT-BR)

| Lacuna Temática em PT-BR | O que o usuário brasileiro precisa resolver | Rota Canônica no Portal NKL | Evidência e Entregável Original |
| --- | --- | --- | --- |
| **Núcleo sintético vs. aço vs. tripa** | Diferença prática de timbre, elasticidade, tempo de assentamento, tensão e custo entre encordoamentos | `/catalogo`, `/guia-de-cordas` e `/fisica-do-som` | Classificação técnica de material do núcleo, resposta do arco e explicação acústica aplicada |
| **Desgaste no clima úmido do Brasil e estabilidade de afinação** | Como calor, maresia no litoral, variação de umidade e suor aceleram oxidação, perda de brilho e desafinação | `/metodologia`, `/catalogo/[id]` e `/clinica` | Campo `climateSensitivity` no catálogo, orientação de manutenção e ajustes recomendados por região |
| **Combinação por brilho/escurecimento do instrumento** | Como compensar um violino estridente ou abafado escolhendo o conjunto ideal entre brilho, calor e projeção | `/comparar`, `/comparador`, `/meu-setup` e `/catalogo/[id]` | Comparação lado a lado de `soundColor`, `projection`, `responseSpeed` e recomendação por perfil de setup |
| **Faixa de preço real e assistência técnica local** | Saber quanto custa o encordoamento no Brasil e onde encontrar luthiers, lojas e professores confiáveis | `/catalogo`, `/luthiers`, `/lojas` e `/professores` | Preços reais em BRL no `Dataset` de cordas e diretórios verificados de profissionais e oficinas |

---

## 4. Hubs Transversais de Apoio e Autoridade

- **Metodologia e Transparência:** `/metodologia` — centraliza os 5 portões de checagem para renda extra, política antifraude, independência de afiliados, critérios acústicos de cordas, cadência de revisão e canal de correções (`contato@nkloficial.com.br`).
- **IA na Prática e Idiomas:** `/ia` e `/blog/aprender/ingles` — fecham as lacunas de qualificação necessárias para acessar oportunidades internacionais em dólar.
- **Contatos e Autoria:** `/contatos` — identificação oficial de `NKL_oficial` e canais oficiais vinculados ao grafo `Schema.org`.
