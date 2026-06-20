/**
 * =======================================================================
 * ARQUIVO CENTRAL DE JAVASCRIPT - PORTAL NKL
 * Contém todas as lógicas de interface, animações e interações do site.
 * =======================================================================
 */

// =======================================================================
// 1. ANIMAÇÃO DE ENTRADA (EFEITO CORTINA E CHACOALHADA)
// =======================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Busca os elementos da animação no HTML
    const logo = document.getElementById('intro-logo');
    const leftCurtain = document.getElementById('curtain-left');
    const rightCurtain = document.getElementById('curtain-right');
    const introBg = document.getElementById('intro-animation');

    // Só executa a animação se os elementos existirem na página (ex: na Home)
    if (logo && leftCurtain && rightCurtain && introBg) {
        // Passo 1: Faz a logo "pular" na tela (efeito Pop-in configurado no CSS)
        logo.classList.add('anim-dot-in');

        // Passo 2: Aguarda 800ms (0.8s) para a logo ser exibida, depois abre a cortina
        setTimeout(() => {
            // Mostra a linha central da cortina
            leftCurtain.classList.add('anim-show-lines');
            rightCurtain.classList.add('anim-show-lines');
            
            // Abre as cortinas para as laterais
            leftCurtain.classList.add('anim-curtain-open-l');
            rightCurtain.classList.add('anim-curtain-open-r');
            
            // Esconde a logo e o fundo da animação
            logo.classList.add('anim-logo-fade');
            introBg.classList.add('anim-bg-fade');
        }, 800);

        // Passo 3: Quando a cortina termina de abrir (2 segundos)
        setTimeout(() => {
            // Remove a div de animação inteira para não atrapalhar os cliques na página
            introBg.style.display = 'none';
            
            // Pega o fundo recém-criado e dá a "chacoalhada orgânica"
            const dynamicBg = document.getElementById('parallax-bg-dynamic');
            if(dynamicBg) {
                dynamicBg.classList.add('anim-shake');
                
                // Remove a classe depois que a animação termina para não conflitar com o Parallax do mouse
                setTimeout(() => { dynamicBg.classList.remove('anim-shake'); }, 1300);
            }
        }, 2000);
    }
});


// =======================================================================
// 2. FUNDO ANIMADO (HONEYCOMB & LOOP INFINITO PARALLAX)
// =======================================================================
document.addEventListener("DOMContentLoaded", () => {
    
    // Remove o fundo estático velho se ele existir no HTML (limpeza para não duplicar)
    const oldBg = document.getElementById('parallax-bg');
    if (oldBg) oldBg.remove();

    // Arrays de dados (Nomes de luthiers vs Símbolos musicais)
    const luthiersAndViolins = [
        "Antonio Stradivari", "Messiah 1716", "Soil 1714", "Betts 1704",
        "Giuseppe Guarneri", "Il Cannone 1743", "Lord Wilton 1742", "Vieuxtemps 1741",
        "Nicolò Amati", "Alard 1649", "King Henry IV 1595", "Hammerle 1658",
        "Andrea Amati", "Charles IX 1564", "The King 1572", "Kurtz 1560",
        "Gasparo da Salò", "Kievman 1590", "Treasury 1580", "Hussey 1585",
        "G.P. Maggini", "Dumas 1615", "De Bériot 1620", "Sainte Cecile 1625",
        "Jacob Stainer", "Stainer 1658", "Stainer 1668", "Stainer 1679",
        "Carlo Bergonzi", "Kreisler 1740", "Baron Knoop 1733", "Perlman 1735",
        "G.B. Guadagnini", "Ex-Vieuxtemps 1750", "Wieniawski 1753", "Grumiaux 1773",
        "J.B. Vuillaume", "Evangéliste 1845", "Ysaÿe 1865", "Carrodus 1850"
    ];

    const musicSymbols = [
        "𝄞", "𝄡", "𝄢", "♩", "♪", "♫", "♬", "𝄾", "𝄿", "𝅀", "♯", "♭", "♮", "𝄆", "𝄇", "𝄐", "𝄪"
    ];

    // Função auxiliar para embaralhar os itens (aleatoriedade)
    const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);

    // Controle dos "bolsões" de dados embaralhados
    let poolLuthiers = shuffle([...luthiersAndViolins]);
    let poolSymbols = shuffle([...musicSymbols]);

    // Função que decide qual item vai pra tela (75% chance de ser nome, 25% de ser símbolo)
    function getNextRandomItem() {
        if (poolLuthiers.length === 0) poolLuthiers = shuffle([...luthiersAndViolins]);
        if (poolSymbols.length === 0) poolSymbols = shuffle([...musicSymbols]);

        const typeDecision = Math.random();
        if (typeDecision < 0.75) { 
            return { item: poolLuthiers.pop(), isSymbol: false };
        } else {
            return { item: poolSymbols.pop(), isSymbol: true };
        }
    }

    // Configuração do Grid (Matemática da malha Honeycomb/Colmeia)
    const minWidth = window.innerWidth * 2; // Fundo será o dobro da tela
    const minHeight = window.innerHeight * 2;
    const cellWidth = 360;  // Distância horizontal entre itens
    const cellHeight = 110; // Distância vertical entre linhas

    const cols = Math.ceil(minWidth / cellWidth) + 1; 
    const rows = Math.ceil(minHeight / cellHeight);

    const layerWidth = cols * cellWidth;
    const layerHeight = rows * cellHeight;

    let htmlContent = '';

    // Geração do painel
    for (let r = 0; r < rows; r++) {
        let isOddRow = (r % 2 === 1); // Verifica se é linha ímpar
        let rowCols = isOddRow ? cols - 1 : cols; // Linha deslocada tem 1 item a menos

        for (let c = 0; c < rowCols; c++) {
            const { item, isSymbol } = getNextRandomItem();
            
            // Cria um leve deslocamento orgânico para não parecer robótico
            let offsetX = (Math.random() * 30) - 15; 
            let offsetY = (Math.random() * 20) - 10;
            let rotate = Math.floor(Math.random() * 20) - 10; 

            let className = isSymbol ? 'music-symbol' : 'violin-name';

            // Ponto central da célula
            let left = (c * cellWidth) + (cellWidth / 2);
            let top = (r * cellHeight) + (cellHeight / 2);

            // Desloca linhas ímpares horizontalmente (Efeito colmeia/intercalado)
            if (isOddRow) left += (cellWidth / 2);

            // Adiciona as imperfeições orgânicas calculadas acima
            left += offsetX;
            top += offsetY;

            // Insere o span no conteúdo HTML
            htmlContent += `<span class="${className}" style="position: absolute; left: ${left}px; top: ${top}px; transform: translate(-50%, -50%) rotate(${rotate}deg); white-space: nowrap;">${item}</span>`;
        }
    }

    // Cria a DIV principal do fundo dinâmico
    const bg = document.createElement('div');
    bg.id = 'parallax-bg-dynamic'; 
    bg.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; overflow: hidden; z-index: -1; pointer-events: none;';

    // Cria a Camada 1
    const layer1 = document.createElement('div');
    layer1.style.cssText = `position: absolute; width: ${layerWidth}px; height: ${layerHeight}px; left: 50%; margin-left: -${layerWidth / 2}px;`;
    layer1.innerHTML = htmlContent;

    // Cria a Camada 2 (Idêntica à 1, para possibilitar o Loop infinito)
    const layer2 = document.createElement('div');
    layer2.style.cssText = `position: absolute; width: ${layerWidth}px; height: ${layerHeight}px; left: 50%; margin-left: -${layerWidth / 2}px;`;
    layer2.innerHTML = htmlContent;

    // Adiciona as camadas ao fundo e o fundo ao site
    bg.appendChild(layer1); 
    bg.appendChild(layer2); 
    document.body.insertBefore(bg, document.body.firstChild);

    // ==========================================
    // MECÂNICA DO PARALLAX E MOUSE
    // ==========================================
    let currentY = 0; 
    let mouseX = 0; 
    let mouseY = 0;

    // Capta o movimento do mouse para mover o fundo (Multiplicador ajustado para 0.4)
    document.addEventListener('mousemove', (e) => {
        mouseX = (window.innerWidth / 2 - e.clientX) * 0.4;
        mouseY = (window.innerHeight / 2 - e.clientY) * 0.4;
        updateTransform();
    });

    // Capta o giro da rodinha do mouse (scroll) para rolar a esteira de itens (Multiplicador ajustado para 1.55)
    window.addEventListener('scroll', () => {
        let sc = window.scrollY || document.documentElement.scrollTop;
        currentY = sc * 1.55; 
        updateTransform();
    });

    // Função vital que recalcula a posição das camadas na tela
    function updateTransform() {
        // Calcula o movimento em Loop usando Módulo (%). Quando a rolagem atinge o tamanho da tela, ela zera invisivelmente.
        let moveY = (currentY % layerHeight); 
        
        // Aplica o movimento + o desvio do mouse na Camada 1
        layer1.style.transform = `translate(${mouseX}px, calc(${moveY}px + ${mouseY}px))`;
        
        // Aplica o movimento + o desvio do mouse na Camada 2, estacionada EXATAMENTE um andar de tela acima ( - layerHeight )
        layer2.style.transform = `translate(${mouseX}px, calc(${moveY - layerHeight}px + ${mouseY}px))`;
    }
    
    // Roda uma vez de imediato para garantir que a tela não inicie em branco
    updateTransform();
});


// =======================================================================
// 3. AUTO-HIDE HEADER (Esconder cabeçalho ao rolar para baixo)
// =======================================================================
let lastScrollTop = 0;
const header = document.getElementById('site-header');
const navMenu = document.getElementById('nav-menu');
const profile = document.querySelector('.profile'); // Busca pelo perfil (usado apenas na página Contatos)

window.addEventListener('scroll', function() {
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    
    // Se existir a área de "Profile" (página de contatos), esconde-a ao rolar 50px
    if(profile) { 
        currentScroll > 50 ? profile.classList.add('esconder') : profile.classList.remove('esconder'); 
    }

    // Se o usuário rolou mais que 100px para baixo, esconde o cabeçalho
    if (currentScroll > lastScrollTop && currentScroll > 100) {
        if(header) header.classList.add('hide');
        if(navMenu) navMenu.classList.remove('show'); // Fecha menu mobile se aberto
    } else {
        // Se rolou pra cima, revela o cabeçalho imediatamente
        if(header) header.classList.remove('hide');
    }
    
    // Evita valores negativos no scroll (bug de elástico no Mac/iOS)
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, false);


// =======================================================================
// 4. CONTROLES DE CLIQUES (MENUS E DROPDOWNS)
// =======================================================================
const logoBtn = document.getElementById('logo-btn');
const logoContainer = document.getElementById('logo-dropdown-container');
const langBtn = document.getElementById('lang-btn');
const langDropdown = document.getElementById('lang-dropdown');
const cordasItem = document.querySelector('.nav-item-dropdown');

// Abrir Dropdown da Logo (Instrumentos)
if(logoBtn) {
    logoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que o clique vaze pro site inteiro e feche o menu na mesma hora
        logoContainer.classList.toggle('show-dropdown');
        if(langDropdown) langDropdown.classList.remove('show-lang');
        if(cordasItem) cordasItem.classList.remove('show-click');
    });
}

// Abrir Dropdown de Idiomas (Bandeiras)
if(langBtn) {
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show-lang');
        if(logoContainer) logoContainer.classList.remove('show-dropdown');
        if(cordasItem) cordasItem.classList.remove('show-click');
    });
}

// Abrir Menu de Cordas (Gráfico e Comparador)
if (cordasItem) {
    const cordasBtn = cordasItem.querySelector('a');
    cordasBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cordasItem.classList.toggle('show-click');
        if(logoContainer) logoContainer.classList.remove('show-dropdown');
        if(langDropdown) langDropdown.classList.remove('show-lang');
    });
}

// Escuta cliques no site todo: se clicar fora de um menu, fecha todos eles.
document.addEventListener('click', () => {
    if(logoContainer) logoContainer.classList.remove('show-dropdown');
    if(langDropdown) langDropdown.classList.remove('show-lang');
    if(cordasItem) cordasItem.classList.remove('show-click');
});


// =======================================================================
// 5. CONTROLE DE TEMA (CLARO / ESCURO)
// =======================================================================
const themeToggleBtn = document.getElementById('theme-toggle');
const body = document.body;

// Tenta resgatar a preferência de tema que o usuário salvou no navegador antes
const savedTheme = localStorage.getItem('nkl_theme');

// Se ele já escolheu "Light" OU se não escolheu nada e o sistema do PC for "Light"
if (savedTheme === 'light' || (!savedTheme && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    body.classList.remove('dark-theme');
} else {
    // Caso contrário, entra no Modo Escuro (Padrão NKL)
    body.classList.add('dark-theme');
}

// Escuta o clique no botão de Lua/Sol
if(themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        // Salva a decisão no cache do navegador para manter quando trocar de aba
        localStorage.setItem('nkl_theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}


// =======================================================================
// 6. MENU MOBILE (BOTÃO HAMBÚRGUER)
// =======================================================================
const mobileBtn = document.getElementById('mobile-menu-btn');
if(mobileBtn) {
    mobileBtn.addEventListener('click', () => {
        // Mostra ou oculta a lista de links quando a tela for menor que 768px
        if(navMenu) navMenu.classList.toggle('show');
    });
}


// =======================================================================
// 7. MODAIS (POP-UPS DE PAYPAL E OUTROS)
// =======================================================================
// Fecha o modal de contribuição
function closePixModal() { 
    const pixModal = document.getElementById('pix-modal');
    if(pixModal) pixModal.classList.remove('show'); 
}


// =======================================================================
// 8. ENVIO DE E-MAIL (FORMSPREE + SISTEMA ANTI-SPAM)
// =======================================================================
const formCaptura = document.getElementById('form-captura');

if(formCaptura) {
    formCaptura.addEventListener('submit', function(event) {
        event.preventDefault(); // Trava o redirecionamento automático da página
        
        const btn = formCaptura.querySelector('.capture-btn');
        
        // SEGURANÇA: Se o botão estiver desativado, ignora o clique (impede duplo clique / spam local)
        if(btn.disabled) return;
        
        // Muda visual do botão e bloqueia novos cliques temporariamente
        btn.disabled = true;
        const originalText = btn.innerHTML;
        btn.innerHTML = "Enviando...";

        const dados = new FormData(formCaptura);
        
        // Envia para o servidor Formspree via requisição invisível (AJAX)
        fetch(formCaptura.action, {
            method: formCaptura.method,
            body: dados,
            headers: { 'Accept': 'application/json' }
        }).then(response => {
            if (response.ok) {
                alert('Recebemos seu e-mail! O PDF será enviado em breve.');
                formCaptura.reset(); // Limpa os campos após o sucesso
                btn.innerHTML = "Enviado ✓";
                
                // SEGURANÇA: Deixa o botão bloqueado por 60 segundos (Cooldown local)
                setTimeout(() => { 
                    btn.disabled = false; 
                    btn.innerHTML = originalText; 
                }, 60000);
            } else {
                alert('Ops, houve um erro ao enviar. Tente novamente.');
                btn.disabled = false; 
                btn.innerHTML = originalText;
            }
        }).catch(error => {
            alert('Erro de conexão. Verifique a internet e tente novamente.');
            btn.disabled = false; 
            btn.innerHTML = originalText;
        });
    });
}
// =======================================================================
// 9. GALERIA E CARROSSEL DE IMAGENS (PÁGINA IMPORTAÇÃO)
// =======================================================================

// Abre a galeria pop-up
function openCarousel(modalId, startIndex) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Trava o fundo
    
    const container = modal.querySelector('.carousel-container');
    const items = container.querySelectorAll('.carousel-item');
    
    // Pula direto para a foto clicada
    if(items[startIndex]) {
        container.style.scrollBehavior = 'auto'; 
        container.scrollLeft = items[startIndex].offsetLeft;
        setTimeout(() => { container.style.scrollBehavior = 'smooth'; }, 50); 
    }
}

// Fecha a galeria e pausa os vídeos
function closeCarousel(modalId) {
    const modal = document.getElementById(modalId);
    if(!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Destrava o fundo
    
    // Pausa os vídeos quando fecha
    const videos = modal.querySelectorAll('video');
    videos.forEach(v => v.pause());
}

// Lógica de rolar pro lado ou abrir Instagram
function scrollCarousel(containerId, direction, instaLink) {
    const container = document.getElementById(containerId);
    if(!container) return;
    
    const scrollAmount = container.clientWidth;
    
    // Se clicou ESQUERDA (-1) e já tá no começo, abre o Insta
    if (direction === -1 && container.scrollLeft <= 5) {
        if(instaLink) window.open(instaLink, '_blank');
        return;
    }
    
    // Se clicou DIREITA (1) e já tá no fim, abre o Insta
    if (direction === 1 && (container.scrollLeft + container.clientWidth >= container.scrollWidth - 5)) {
        if(instaLink) window.open(instaLink, '_blank');
        return;
    }

    container.scrollBy({ left: scrollAmount * direction, behavior: 'smooth' });
}
// =======================================================================
// 10. FILTRO DE EQUIPAMENTOS RECOMENDADOS
// =======================================================================
function filterCategory(category, btn) {
    // 1. Atualiza o visual dos botões
    const filterContainer = btn.parentElement;
    filterContainer.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // 2. Filtra os cartões (mostra/esconde) com base no atributo data-inst
    document.querySelectorAll('.product-card').forEach(card => {
        const inst = card.getAttribute('data-inst');
        // Se a categoria for "todos", "geral" (breus) ou a categoria exata clicada, exibe o cartão.
        if (category === 'todos' || inst === 'geral' || inst === category) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });

    // 3. Esconde os subtítulos/divisores se não houver produtos dentro deles
    document.querySelectorAll('.product-grid').forEach(grid => {
        // Verifica se existe pelo menos um card visível dentro deste grid
        const visibleCards = Array.from(grid.querySelectorAll('.product-card')).some(c => c.style.display !== 'none');
        const divider = grid.previousElementSibling; 
        
        // Esconde o grid inteiro e o divisor se estiver vazio
        if (divider && divider.classList.contains('subcategory-divider')) {
            if (!visibleCards) {
                grid.style.display = 'none';
                divider.style.display = 'none';
            } else {
                grid.style.display = 'grid'; 
                divider.style.display = 'block';
            }
        }
    });
}