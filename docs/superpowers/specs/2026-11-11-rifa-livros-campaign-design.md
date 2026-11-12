# Design: campanha de apoio com rifa de livros

## Intenção

Apresentar a ação externa de três livros físicos como uma forma transparente
de apoiar a manutenção do Portal NKL, sem interromper a leitura nem confundir
compra de número com doação.

## Decisão

Usar três superfícies complementares em todas as páginas públicas:

1. Banner discreto e persistente, com fechamento e controle de frequência.
2. Card contextual após o conteúdo principal.
3. Popup de saída uma vez por sessão, apenas para visitantes que ainda não
   interagiram com a campanha.

As superfícies não aparecerão em checkout, login, cadastro, perfil privado,
dashboard, admin ou páginas de erro.

## Copy inicial

### Banner

**O Portal NKL já te ajudou em alguma decisão?**  
Ajude a manter a curadoria independente participando de uma ação por R$ 3 e
concorra a três livros físicos sobre finanças e empreendedorismo.

CTAs:

- `Participar por R$ 3`
- `Ver prêmios e regras`

### Card

**Uma forma de apoiar o Portal**  
A ação é realizada e processada pela 123Rifas. Consulte os prêmios, regras,
data do sorteio e condições antes de participar.

### Popup de saída

**Antes de você sair**  
Se o Portal NKL já foi útil para você, considere apoiar o projeto participando
da ação de livros por R$ 3.

O popup terá os mesmos CTAs do banner e um fechamento explícito.

## Regras de experiência

- O banner pode ser fechado por sete dias.
- O popup aparece no máximo uma vez por sessão.
- O popup não aparece depois de clique em qualquer CTA da campanha.
- O card permanece no fluxo normal da página, sem bloquear conteúdo.
- Links externos usam nova aba, `noopener noreferrer` e aviso de destino externo.
- O texto nunca chama a compra de número de “doação”.
- A campanha não promete renda, retorno financeiro ou prêmio garantido.

## Rastreamento

Registrar somente eventos agregados:

- impressão por superfície;
- fechamento;
- clique em participar;
- clique em prêmios e regras.

Os eventos não incluirão CPF, e-mail ou qualquer dado pessoal. UTM própria
identificará a origem (`banner`, `card` ou `exit_popup`).

## Transparência e conformidade

- Informar que a ação é externa e processada pela 123Rifas.
- Linkar diretamente para a página oficial da ação:
  `https://123rifas.com/acao/os-3-melhores-livros-de-financas-fisicos`.
- Recomendar que o visitante consulte regulamento, data, critérios e
  condições da plataforma antes de comprar.
- Antes da publicação, confirmar que a ação está regular e autorizada para o
  público-alvo e território aplicável.

## Não objetivos

- Não processar o pagamento da rifa no Portal NKL.
- Não armazenar dados de compradores da rifa.
- Não alterar o checkout Stripe do Portal.
- Não exibir a campanha em áreas privadas ou administrativas.

## Implementação prevista

- Criar uma configuração única para URL, copy e parâmetros UTM.
- Criar componentes reutilizáveis de banner, card e popup.
- Integrar as superfícies no layout público sem duplicar lógica.
- Usar estado local/session storage para frequência e fechamento.
- Adicionar testes para exclusão de rotas privadas, frequência e destino dos
  links.
