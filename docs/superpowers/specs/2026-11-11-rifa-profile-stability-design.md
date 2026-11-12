# Design: campanha sem sobreposição e perfil resiliente

## Intenção

Tornar a campanha de apoio menos invasiva e corrigir a tela `/perfil` para que
falhas em dados opcionais não impeçam o usuário autenticado de acessar o
próprio perfil.

## Comportamento aprovado

- A campanha deve mencionar que o prêmio são **3 livros físicos**.
- Os botões devem usar apenas o texto **“Participar”**.
- O texto visível não precisa mencionar a 123Rifas nem dizer que a ação é
  processada por ela.
- Card, banner e popup não podem aparecer simultaneamente na mesma sessão.
- Uma única superfície da campanha será escolhida por sessão; fechar ou
  participar impede as outras superfícies nessa sessão.
- O perfil continuará exigindo autenticação.
- Leituras opcionais do perfil, como compras de guias e favoritos, devem falhar
  com registro explícito no servidor e usar valores vazios, sem esconder erros
  de ações de escrita.

## Fora de escopo

- Não alterar o destino externo, o rastreamento UTM ou o checkout da ação.
- Não alterar o schema remoto nem executar migration ou deploy.
- Não transformar falhas de autenticação ou de atualização do perfil em sucesso.
