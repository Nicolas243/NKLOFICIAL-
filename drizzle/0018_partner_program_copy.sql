UPDATE "partner_programs"
SET
  "short_description" = CASE "slug"
    WHEN 'prolific' THEN 'Participe de estudos remunerados e use alguns minutos livres para responder pesquisas que combinam com seu perfil.'
    WHEN 'clickworker' THEN 'Comece em 3 passos: crie seu perfil, escolha microtarefas e trabalhe online conforme surgirem projetos.'
    WHEN 'joinbrands' THEN 'Crie vídeos para marcas em casa e encontre campanhas de conteúdo UGC sem precisar montar uma equipe.'
    WHEN 'aligner' THEN 'Use seu olhar para avaliar conteúdos de IA em projetos flexíveis, com tarefas que cabem na sua rotina.'
    WHEN 'marketplaces-afiliados' THEN 'Monte seu catálogo de recomendações e divulgue produtos em 3 canais: grupos, redes sociais e conteúdo.'
    WHEN 'upwork' THEN 'Transforme uma habilidade em serviço e encontre clientes internacionais em mais de uma área profissional.'
    WHEN 'hotmart' THEN 'Escolha produtos digitais, divulgue seu link e acompanhe suas comissões em uma única plataforma.'
    WHEN 'sideshift' THEN 'Explore trocas de ativos digitais com cadastro rápido e confira as condições antes de cada operação.'
    WHEN 'oneforma' THEN 'Encontre projetos em 4 frentes: voz, tradução, dados e anotação para inteligência artificial.'
    WHEN 'crowdato' THEN 'Participe de tarefas digitais e projetos de dados com horários flexíveis e seleção por perfil.'
    WHEN 'claru-ia' THEN 'Aplique seu conhecimento em tarefas de IA e avance por projetos conforme sua experiência e disponibilidade.'
    WHEN 'flambra' THEN 'Descubra oportunidades online em um só lugar e filtre as opções que combinam com suas habilidades.'
    WHEN 'outlier-ai' THEN 'Ajude a melhorar modelos de IA em projetos internacionais, com tarefas que valorizam raciocínio e escrita.'
    WHEN 'billo' THEN 'Grave vídeos UGC em casa para marcas e transforme seu celular em uma ferramenta de criação de conteúdo.'
    WHEN 'amazon-influencer' THEN 'Grave vídeos de produtos que você já conhece e concorra a até 13% de comissão em categorias elegíveis.'
    WHEN 'testlio' THEN 'Teste sites e aplicativos em projetos globais de qualidade e transforme atenção aos detalhes em oportunidade.'
    WHEN 'mercado-pago' THEN 'Indique uma solução digital que você já conhece e acompanhe campanhas de recompensa pelo celular.'
    WHEN 'hub' THEN 'Encontre tarefas digitais em um só lugar e veja quais oportunidades de conteúdo combinam com você.'
    WHEN 'fiverr' THEN 'Publique seu serviço em 3 passos e ofereça design, texto, edição ou tecnologia para clientes do mundo todo.'
    WHEN 'apphub' THEN 'Grave vídeos em casa para tarefas de conteúdo e confira campanhas abertas para o seu perfil.'
    WHEN 'dataannotation' THEN 'Trabalhe na avaliação de respostas de IA em projetos flexíveis, com seleção baseada no seu perfil.'
    WHEN 'honeygain' THEN 'Compartilhe conexão ociosa e acumule créditos em segundo plano, com retorno variável por país e demanda.'
    WHEN 'quintoandar-indica-ai' THEN 'Indique um imóvel com autorização e ganhe R$ 100 quando ele for publicado, além de recompensas previstas.'
    WHEN 'utest' THEN 'Teste aplicativos, jogos e sites em projetos globais de QA e ajude a encontrar problemas antes do lançamento.'
    WHEN 'oort-datahub' THEN 'Participe de tarefas de dados e ajude a treinar IA usando seu conhecimento, atenção e disponibilidade.'
    ELSE "short_description"
  END,
  "long_description" = CASE "slug"
    WHEN 'amazon-influencer' THEN 'O Amazon Influencer permite criar uma vitrine e publicar vídeos sobre produtos que você conhece. No programa brasileiro de Associados, algumas categorias chegam a 13% de comissão padrão, mas a taxa depende da categoria, da compra qualificada e das regras vigentes. Você não deve tratar o percentual como garantia: confira a tabela oficial antes de publicar.'
    WHEN 'joinbrands' THEN 'A JoinBrands conecta criadores a campanhas de conteúdo gerado por usuários. Em vez de depender apenas de seguidores, você pode apresentar seu estilo por meio de vídeos gravados em casa. A disponibilidade, o briefing e o valor de cada campanha variam; leia os requisitos antes de aceitar.'
    WHEN 'billo' THEN 'A Billo reúne campanhas de vídeos UGC para marcas. Você pode gravar com o celular, seguir um briefing e enviar o material sem precisar ter uma grande audiência. As campanhas, exigências e pagamentos variam por região e projeto.'
    WHEN 'apphub' THEN 'O AppHub reúne oportunidades que podem envolver gravação de vídeos e produção de conteúdo em casa. Veja as campanhas disponíveis, confira o briefing e só aceite tarefas que você consegue entregar. A oferta depende do seu perfil, região e momento.'
    WHEN 'clickworker' THEN 'A Clickworker oferece microtarefas de pesquisa, classificação, verificação e produção de dados. O caminho é simples: cadastro, qualificação e escolha das tarefas disponíveis. O valor e a quantidade de trabalho variam por país, perfil e demanda.'
    WHEN 'honeygain' THEN 'O Honeygain permite compartilhar recursos de conexão ociosa em troca de créditos. O app pode funcionar em segundo plano, mas o retorno depende de país, demanda, dispositivo e disponibilidade. Leia as políticas de uso e privacidade antes de instalar.'
    WHEN 'quintoandar-indica-ai' THEN 'No Indica Aí, você pode indicar um imóvel residencial com autorização do proprietário. As condições divulgadas incluem R$ 100 quando o imóvel é publicado e 10% do primeiro aluguel quando a locação acontece; valores, cidades, prazos e critérios podem mudar. Nunca compartilhe nome ou telefone sem consentimento explícito.'
    WHEN 'fiverr' THEN 'No Fiverr, você cria ofertas de serviços como design, redação, edição, tecnologia e marketing. Monte seu perfil, publique uma oferta e apresente seu portfólio para clientes de vários países. A renda depende da demanda, do preço, da concorrência e da entrega.'
    WHEN 'upwork' THEN 'A Upwork conecta freelancers a clientes em projetos de redação, design, programação, suporte e muitas outras áreas. Você envia propostas para trabalhos compatíveis com seu perfil. A aprovação, a concorrência e o valor variam conforme cada projeto.'
    WHEN 'hotmart' THEN 'Na Hotmart, afiliados escolhem produtos digitais, recebem um link e divulgam para o público certo. As comissões e regras são definidas pelo produtor e podem mudar. Faça uma divulgação honesta e confira as condições antes de promover.'
    WHEN 'marketplaces-afiliados' THEN 'Programas de afiliados permitem recomendar produtos por links rastreáveis. Você pode começar escolhendo um nicho, criando conteúdo útil e acompanhando os cliques e resultados. Comissão, prazo e aprovação dependem de cada marketplace.'
    WHEN 'mercado-pago' THEN 'O Mercado Pago oferece carteira digital, pagamentos e serviços financeiros. Campanhas de indicação podem pagar recompensas conforme regras, período e elegibilidade. Confira a campanha ativa antes de divulgar e nunca prometa um valor que não esteja nos termos.'
    WHEN 'oneforma' THEN 'A OneForma reúne projetos de dados, voz, tradução e anotação para inteligência artificial. Você cria um perfil, verifica os requisitos e se candidata aos projetos compatíveis. A disponibilidade e a remuneração variam por idioma, país e campanha.'
    WHEN 'outlier-ai' THEN 'A Outlier AI reúne projetos de avaliação, escrita e refinamento de respostas de inteligência artificial. As tarefas podem ser remotas e internacionais, mas exigem aprovação e podem pedir conhecimento específico. Verifique a elegibilidade e os termos do projeto.'
    WHEN 'testlio' THEN 'A Testlio conecta testadores a projetos de qualidade para sites, aplicativos e serviços digitais. Você recebe instruções, reproduz cenários e reporta problemas com clareza. Convites, disponibilidade e pagamento variam por projeto e região.'
    WHEN 'utest' THEN 'A uTest oferece projetos de teste para aplicativos, jogos, sites e dispositivos. Depois do cadastro, você pode participar de ciclos compatíveis com seu perfil e reportar bugs seguindo as regras. O volume de convites e a remuneração não são garantidos.'
    WHEN 'dataannotation' THEN 'A DataAnnotation trabalha com tarefas de avaliação, comparação e produção de dados para sistemas de IA. A seleção pode exigir escrita, raciocínio ou conhecimento de uma área. Projetos, disponibilidade e pagamento dependem da aprovação e da demanda.'
    WHEN 'aligner' THEN 'A Aligner reúne tarefas de avaliação e treinamento de inteligência artificial. O trabalho costuma pedir atenção a critérios e consistência nas respostas. A disponibilidade, o processo seletivo e a remuneração devem ser confirmados na plataforma.'
    WHEN 'crowdato' THEN 'A Crowdato reúne tarefas digitais e projetos relacionados a dados. Crie seu perfil, confira as qualificações e candidate-se ao que combina com você. O volume e os valores variam conforme país, projeto e aprovação.'
    WHEN 'claru-ia' THEN 'A Claru IA apresenta oportunidades relacionadas à avaliação e ao treinamento de sistemas de inteligência artificial. Leia o escopo de cada tarefa, confirme os requisitos e considere o tempo necessário antes de aceitar.'
    WHEN 'flambra' THEN 'A Flambra reúne possibilidades de trabalho e renda online em diferentes formatos. Use a plataforma para descobrir opções, mas confira sempre quem oferece a tarefa, os requisitos e as condições antes de enviar dados ou pagar qualquer valor.'
    WHEN 'hub' THEN 'A Hub reúne oportunidades digitais e tarefas de conteúdo. Explore as campanhas abertas, confira o briefing e escolha apenas atividades compatíveis com sua rotina. As oportunidades e os valores podem mudar conforme perfil, região e demanda.'
    WHEN 'prolific' THEN 'A Prolific conecta participantes a estudos acadêmicos e pesquisas de mercado. Você responde apenas aos estudos para os quais se qualifica, e a remuneração e a disponibilidade aparecem antes da participação. Perfil, país e demanda influenciam os convites.'
    WHEN 'oort-datahub' THEN 'O OORT DataHub reúne tarefas de coleta, preparação e anotação de dados para projetos de tecnologia. O cadastro pode exigir código de indicação e a oferta depende de perfil, região, critérios e disponibilidade de cada projeto.'
    ELSE "long_description"
  END,
  "updated_at" = now()
WHERE "slug" IN (
  'clickworker', 'joinbrands', 'aligner', 'marketplaces-afiliados', 'upwork',
  'hotmart', 'sideshift', 'oneforma', 'crowdato', 'claru-ia', 'flambra',
  'outlier-ai', 'billo', 'amazon-influencer', 'testlio', 'mercado-pago',
  'hub', 'fiverr', 'apphub', 'dataannotation', 'honeygain',
  'quintoandar-indica-ai', 'utest', 'prolific', 'oort-datahub'
);
