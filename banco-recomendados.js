// =======================================================================
// BANCO DE DADOS: EQUIPAMENTOS RECOMENDADOS NKL
// Categorias suportadas (secao): "arcos", "breus", "espalheiras", "cavaletes"
// Instrumentos suportados: "violino", "viola", "cello", "geral"
// =======================================================================

const dbRecomendados = [
    // ==========================================
    // 🏹 ARCOS - VIOLINO
    // ==========================================
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "MADEIRA MAÇARANDUBA",
        titulo: "Arco de Madeira Maçaranduba 4/4",
        comentario: '"Dois alunos compraram e achei Excelente."',
        preco: "R$ 159",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/6pm8v9NS3U" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "FIBRA DE CARBONO",
        titulo: "Arco Fibra de Carbono Talão Flor de Lis",
        comentario: '"Excelente estabilidade e distribuição de peso."',
        preco: "R$ 254",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/40RxXvig8W" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "MADEIRA OITAVADO",
        titulo: "Arco Profissional Oitavado Flor de Lis Gold",
        comentario: '"Crina Animal Mongólia."',
        preco: "R$ 259",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/2fxCNtKqaH" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "MADEIRA PREMIUM",
        titulo: "Arco Madeira Guarnição Premium",
        comentario: '"Arco que uso atualmente, super recomendo."',
        preco: "R$ 259",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/2VdmBwtM2t" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "FIBRA TRANÇADO",
        titulo: "Arco Fibra Carbono Trançado",
        comentario: '"Sou mais arco de madeira, mas ótima opção em fibra."',
        preco: "R$ 309 - R$ 310",
        botoes: [ 
            { classe: "btn-shopee", texto: "Talão Gold", link: "https://s.shopee.com.br/7KiPW1vxRD" },
            { classe: "btn-shopee", texto: "Flor Lis Gold", link: "https://s.shopee.com.br/7peg6ZYXyS" }
        ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PAU COBRA",
        titulo: "Arco Premium Pau Cobra Flor Lis Gold",
        comentario: '"Profissional premium."',
        preco: "R$ 332",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/7fLsLKqwwP" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PAU BRASIL",
        titulo: "Arco Pau Brasil Oficina",
        comentario: '"Madeira nobre, salto de qualidade considerável."',
        preco: "R$ 601",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/1BC9Qbs" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PAU COBRA PREMIUM",
        titulo: "Arco Pau Cobra Premium",
        comentario: '"Estabilidade superior na condução do som."',
        preco: "R$ 789",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/2NXmhRE" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PERNAMBUCO ORQUEZZ",
        titulo: "Arco Pau Brasil Pernambuco Orquezz",
        comentario: '"Madeira selecionada nível orquestra."',
        preco: "R$ 867",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/1ttgU6G" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PAU BRASIL OLIST",
        titulo: "Arco Pau Brasil Olist",
        comentario: '"Opção premium em Pau Brasil."',
        preco: "R$ 917",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/26k7ZJP" } ]
    },
    {
        secao: "arcos", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "PERNAMBUCO MARFIM",
        titulo: "Arco Pernambuco Talão Osso Marfim",
        comentario: '"A obra-prima do setup. Resposta instantânea e timbre limpo."',
        preco: "R$ 1.597",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/1Xq6QGb" } ]
    },

    // ==========================================
    // 🏹 ARCOS - VIOLA
    // ==========================================
    {
        secao: "arcos", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "MASSARANDUBA",
        titulo: "Arco Viola Profissional Massaranduba",
        comentario: '"Boa relação custo/benefício para iniciar."',
        preco: "R$ 265",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/9KdAnpOEqR" } ]
    },
    {
        secao: "arcos", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "PHOENIX CLASSIC",
        titulo: "Arco Profissional Viola Phoenix Classic",
        comentario: '"Construção robusta."',
        preco: "R$ 357",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/AUp8ByJnTg" } ]
    },
    {
        secao: "arcos", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "MADEIRA IPÊ",
        titulo: "Arco Profissional Viola Madeira Ipê",
        comentario: '"Tá muito barato."',
        preco: "R$ 538",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/AKVhzfKQof" } ]
    },
    {
        secao: "arcos", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "PAU BRASIL PERNAMBUCO",
        titulo: "Arco Viola Pau Brasil Pernambuco",
        comentario: '"O salto definitivo para timbre profissional em viola."',
        preco: "R$ 1.259",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/2ixcoyQ" } ]
    },

    // ==========================================
    // 🏹 ARCOS - CELLO
    // ==========================================
    {
        secao: "arcos", instrumento: "cello", grupo: "Violoncelo", badge: "",
        thumb: "MASSARANDUBA BÁSICO",
        titulo: "Arco Cello 4/4 Massaranduba",
        comentario: '"Opção de entrada para estudo."',
        preco: "R$ 175",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/8V43o5ASP5" } ]
    },
    {
        secao: "arcos", instrumento: "cello", grupo: "Violoncelo", badge: "",
        thumb: "FLOR LIS MASSARANDUBA",
        titulo: "Arco Cello Flor Lis Massaranduba",
        comentario: '"Melhor acabamento visual e peso."',
        preco: "R$ 315",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/8KkdbmB5k2" } ]
    },
    {
        secao: "arcos", instrumento: "cello", grupo: "Violoncelo", badge: "",
        thumb: "PROFISSIONAL IPÊ",
        titulo: "Arco Profissional Cello Madeira Ipê",
        comentario: '"Material nobre e resposta ágil."',
        preco: "R$ 727 <span style='font-size:0.8rem;font-weight:normal'>(PIX)</span>",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/8ARDPTBj4z" } ]
    },

    // ==========================================
    // 🪨 BREUS (Serve para todos)
    // ==========================================
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "RIO CLARO",
        titulo: "Breu Rio Claro (Escuro ou Claro)",
        comentario: '"O Melhor até um bom tempo."',
        preco: "R$ 35",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee 1", link: "https://s.shopee.com.br/900KQcuMNQ" },
            { classe: "btn-shopee", texto: "Shopee 2", link: "https://s.shopee.com.br/9AJkcvtj2T" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/2yojfwT" }
        ]
    },
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "D'ADDARIO KAPLAN CLARO",
        titulo: "Breu D'addario Kaplan Claro",
        comentario: '"Timbre suave, pouca poeira."',
        preco: "R$ 80 - R$ 140",
        botoes: [ 
            { classe: "btn-shopee", texto: "Opc 1 (R$80)", link: "https://s.shopee.com.br/4L5O3PF476" },
            { classe: "btn-shopee", texto: "Opc 2 (R$140)", link: "https://s.shopee.com.br/5KxvFJUP6A" }
        ]
    },
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "SOLLO MEIO A MEIO",
        titulo: "Breu Sollo Meio a Meio",
        comentario: '"Parece moeda de 1 Real. Mistura versátil."',
        preco: "R$ 85",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/8fNU20vd3O" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/2cDSHMn" }
        ]
    },
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "GUSTAVE BERNARDEL",
        titulo: "Breu Gustave Bernardel Claro",
        comentario: '"O mais famoso atualmente e o melhor custo benefício."',
        preco: "R$ 130",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/7069ER0Rcn" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/2eW4eRD" }
        ]
    },
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "D'ADDARIO KAPLAN ESCURO",
        titulo: "Breu D'addario Kaplan Escuro",
        comentario: '"Caixa de aliança. Mais aderência."',
        preco: "R$ 130",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/9zjknrr2lF" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/2SATf61" }
        ]
    },
    {
        secao: "breus", instrumento: "geral", grupo: "Geral", badge: "",
        thumb: "CECILIA SOLO",
        titulo: "Breu Cécilia Solo Mini Claro",
        comentario: '"O melhor breu para muitos músicos solistas."',
        preco: "R$ 215",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/5AeV2qZ4sv" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/1ugWoFg" }
        ]
    },

    // ==========================================
    // 🛋️ ESPALHEIRAS - VIOLINO
    // ==========================================
    {
        secao: "espalheiras", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "ESPALHEIRA METAL",
        titulo: "Espalheira Ergonômica Metal",
        comentario: '"Você modela conforme o corpo. Melhor que a minha de 300 reais."',
        preco: "R$ 30",
        botoes: [ { classe: "btn-amazon", texto: "Aliexpress", link: "https://pt.aliexpress.com/item/1005007030905504.html" } ]
    },
    {
        secao: "espalheiras", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "ESPALHEIRA ESPUMA",
        titulo: "Espalheira Espuma Violino/Viola",
        comentario: '"Para quem acha espalheira tradicional muito desconfortável."',
        preco: "R$ 70",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/1TUB3dG" } ]
    },
    {
        secao: "espalheiras", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "RIO CLARO SPALLA",
        titulo: "Espalheira Rio Claro Spalla",
        comentario: '"Estilo ombreira tradicional."',
        preco: "R$ 72",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/11Sgyk5" } ]
    },
    {
        secao: "espalheiras", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "LUNNON PREMIUM",
        titulo: "Lunnon Premium Black",
        comentario: '"Ajuste alto excelente para quem tem 3 metros de pescoço."',
        preco: "R$ 91",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/28oq9qz" } ]
    },
    {
        secao: "espalheiras", instrumento: "violino", grupo: "Violino", badge: "",
        thumb: "WOLF FORTE SECONDO",
        titulo: "Wolf Forte Secondo 4/4",
        comentario: '"Ergonômica nível profissional."',
        preco: "R$ 373",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/1obxkaV" } ]
    },

    // ==========================================
    // 🛋️ ESPALHEIRAS - VIOLA
    // ==========================================
    {
        secao: "espalheiras", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "ESPUMA VIOLA",
        titulo: "Espalheira Espuma Violino/Viola",
        comentario: '"Leve e confortável."',
        preco: "R$ 70",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://meli.la/1TUB3dG" } ]
    },
    {
        secao: "espalheiras", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "RIO CLARO VIOLA",
        titulo: "Espalheira Rio Claro Viola (Até 42)",
        comentario: '"Suporte clássico."',
        preco: "R$ 70",
        botoes: [ { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/BOvwKjN7i" } ]
    },
    {
        secao: "espalheiras", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "LUNNON PREMIUM VIOLA",
        titulo: "Viola Lunnon Premium Preta Ajustável",
        comentario: '"Para quem é pescoçudo."',
        preco: "R$ 93 - R$ 110",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/40beVJjWbe" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://meli.la/2njMbhq" }
        ]
    },
    {
        secao: "espalheiras", instrumento: "viola", grupo: "Viola de Arco", badge: "",
        thumb: "WOLF FORTE PRIMO",
        titulo: "Wolf Forte Primo Viola",
        comentario: '"Profissional. Ergonômica."',
        preco: "R$ 206 - R$ 341",
        botoes: [ 
            { classe: "btn-shopee", texto: "R$ 206 (Inf.)", link: "https://s.shopee.com.br/4VXv6N9Bi4" },
            { classe: "btn-shopee", texto: "R$ 236", link: "https://s.shopee.com.br/BOvwEYWmH" },
            { classe: "btn-ml", texto: "M. Livre (PIX)", link: "https://meli.la/2N9Shtk" }
        ]
    },

    // ==========================================
    // 🌉 CAVALETES - VIOLINO
    // ==========================================
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "EXCELENTE",
        thumb: "AUBERT SUPER DE LUXE",
        titulo: "Aubert Super De Luxe (Francês)",
        comentario: '"Madeira tratada historicamente para projeção máxima."',
        preco: "R$ 345",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/8zz2Wf77px" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2TWjicL" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "EXCELENTE",
        thumb: "BARSA DE LUXE",
        titulo: "Barsa De Luxe (Bósnia)",
        comentario: '"Estou com um, logo irei instalar no meu violino."',
        preco: "R$ 289",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/1XfCC2x" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "EXCELENTE",
        thumb: "MILO STAMM ROYAL",
        titulo: "Milo Stamm Royal (Alemão)",
        comentario: '"Top de linha Alemão."',
        preco: "R$ 345",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/1ALbTbF" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "EXCELENTE",
        thumb: "DESPIAU 3 ÁRVORES",
        titulo: "Despiau A 3 Árvores (Francês)",
        comentario: '"Uma das escolhas preferidas por solistas mundiais."',
        preco: "R$ 300",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/1ZSZror" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "MUITO BOM",
        thumb: "BARSA 3 ESTRELAS",
        titulo: "Barsa 3 Estrelas (Bósnia)",
        comentario: "",
        preco: "R$ 245",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/2duFXod" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "MUITO BOM",
        thumb: "AUBERT MIRECOURT LUXE",
        titulo: "Aubert Mirecourt Luxe (Francês)",
        comentario: "",
        preco: "R$ 285",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/2rFPHzb" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "MUITO BOM",
        thumb: "MILO STAMM PREMIUM",
        titulo: "Milo Stamm Premium (Alemão)",
        comentario: '"Já instalei num violino, muito muito bom."',
        preco: "R$ 180 - R$ 184",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/LZxSnUjd2" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2wAWPtS" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "MUITO BOM",
        thumb: "DESPIAU B 2 ÁRVORES",
        titulo: "Despiau B 2 Árvores",
        comentario: "",
        preco: "R$ 190",
        botoes: [ { classe: "btn-ml", texto: "Mercado Livre", link: "https://mercadolivre.com/sec/13YZHdJ" } ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "BARSA 1 E 2 ESTRELAS",
        titulo: "Barsa 1 ou 2 Estrelas (Bósnia)",
        comentario: "",
        preco: "R$ 55 - R$ 145",
        botoes: [ 
            { classe: "btn-ml", texto: "1 Estrela", link: "https://mercadolivre.com/sec/2Gsf1zN" },
            { classe: "btn-ml", texto: "2 Estrelas", link: "https://mercadolivre.com/sec/2duFXod" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "AUBERT MIRECOURT",
        titulo: "Aubert Mirecourt in France",
        comentario: "",
        preco: "R$ 89 - R$ 128",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee 1", link: "https://s.shopee.com.br/30aifXa84Y" },
            { classe: "btn-shopee", texto: "Shopee 2", link: "https://s.shopee.com.br/BGXIW6s1f" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2c78K8Z" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "MILO STAMM PADRÃO",
        titulo: "Milo Stamm Padrão (Alemão)",
        comentario: "",
        preco: "R$ 115 - R$ 118",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/9pR2mSBijT" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2KSBR3J" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "DESPIAU SUPERIOR C",
        titulo: "Despiau Superior C (1 Árvore)",
        comentario: '"O meu atual faz muita diferença."',
        preco: "R$ 105 - R$ 137",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/6pnRFGQV48" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2yCYQww" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "DESPIAU SUPERIOR D",
        titulo: "Despiau Superior D",
        comentario: '"Já instalei em vários violinos."',
        preco: "R$ 52 - R$ 54",
        botoes: [ 
            { classe: "btn-shopee", texto: "41.5mm", link: "https://s.shopee.com.br/x6x3YUY3" },
            { classe: "btn-shopee", texto: "Padrão", link: "https://s.shopee.com.br/5puttjVAD9" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/33KqkJg" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "violino", grupo: "Violino", badge: "BOM",
        thumb: "AUBERT IN FRANCE",
        titulo: "Aubert in France",
        comentario: "",
        preco: "R$ 48",
        botoes: [ 
            { classe: "btn-shopee", texto: "Shopee", link: "https://s.shopee.com.br/AA3t3kvS6g" },
            { classe: "btn-ml", texto: "M. Livre", link: "https://mercadolivre.com/sec/2bk5GNF" }
        ]
    },

    // ==========================================
    // 🌉 CAVALETES - VIOLA
    // ==========================================
    {
        secao: "cavaletes", instrumento: "viola", grupo: "Viola de Arco", badge: "MUITO BOM",
        thumb: "MILO STAMM PREMIUM VIOLA",
        titulo: "Milo Stamm Premium",
        comentario: "",
        preco: "R$ 235",
        botoes: [ 
            { classe: "btn-shopee", texto: "48mm", link: "https://s.shopee.com.br/7Kjhr1U3gC" },
            { classe: "btn-shopee", texto: "52mm", link: "https://s.shopee.com.br/8pYVdsLvMw" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "viola", grupo: "Viola de Arco", badge: "BOM",
        thumb: "AUBERT MIRECOURT VIOLA",
        titulo: "Aubert Mirecourt Viola",
        comentario: "",
        preco: "A partir de R$ 123",
        botoes: [ 
            { classe: "btn-shopee", texto: "42mm", link: "https://s.shopee.com.br/6VAaqPKd3z" },
            { classe: "btn-shopee", texto: "46mm", link: "https://s.shopee.com.br/6VAaqRkDfZ" },
            { classe: "btn-shopee", texto: "48mm", link: "https://s.shopee.com.br/6KrAe0fHnh" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "viola", grupo: "Viola de Arco", badge: "BOM",
        thumb: "MILO STAMM PADRÃO VIOLA",
        titulo: "Milo Stamm Padrão Viola",
        comentario: "",
        preco: "R$ 125 - R$ 130",
        botoes: [ 
            { classe: "btn-shopee", texto: "46mm", link: "https://s.shopee.com.br/3Au8tfTRii" },
            { classe: "btn-shopee", texto: "48mm", link: "https://s.shopee.com.br/2qHIUzEfBK" },
            { classe: "btn-shopee", texto: "52mm", link: "https://s.shopee.com.br/8KcF3BrN16" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "viola", grupo: "Viola de Arco", badge: "BOM",
        thumb: "DESPIAU SUP. C (1 ÁRVORE) VIOLA",
        titulo: "Despiau Superior C (1 Árvore)",
        comentario: "",
        preco: "R$ 120 - R$ 135",
        botoes: [ 
            { classe: "btn-shopee", texto: "46mm", link: "https://s.shopee.com.br/LZxVpGJuW" },
            { classe: "btn-shopee", texto: "48mm (Op1)", link: "https://s.shopee.com.br/4q2Ms1wTRH" },
            { classe: "btn-shopee", texto: "48mm (Op2)", link: "https://s.shopee.com.br/5AfDGniIUI" },
            { classe: "btn-shopee", texto: "50mm", link: "https://s.shopee.com.br/6VAarKxGjT" }
        ]
    },
    {
        secao: "cavaletes", instrumento: "viola", grupo: "Viola de Arco", badge: "BOM",
        thumb: "DESPIAU SUPERIOR D VIOLA",
        titulo: "Despiau Superior D Viola",
        comentario: "",
        preco: "R$ 57 - R$ 62",
        botoes: [ 
            { classe: "btn-shopee", texto: "46mm", link: "https://s.shopee.com.br/50Ln4GFSS8" },
            { classe: "btn-shopee", texto: "48mm", link: "https://s.shopee.com.br/7fMYF8AVuf" }
        ]
    }
];