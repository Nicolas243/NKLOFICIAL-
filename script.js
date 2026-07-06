/**
 * =======================================================================
 * ARQUIVO CENTRAL DE JAVASCRIPT - PORTAL NKL
 * Contém todas as lógicas de interface, animações e interações do site.
 * =======================================================================
 */
/**
 * =======================================================================
 * 0. INJEÇÃO GLOBAL DE LAYOUT (HEADER, FOOTER, MODAIS)
 * =======================================================================
 */
function injectGlobalLayout() {
    // 1. Constrói o Header
    const headerHTML = `
        <header id="site-header" class="site-header">
            <nav>
                <div class="nav-brand-container" id="logo-dropdown-container">
                    <img src="NKL/NKL.png" class="nav-brand-logo" alt="Logo NKL">
                    <button class="logo-dropdown-btn" id="logo-btn">Violino▾</button>
                    <div class="logo-dropdown-content">
                        <a href="#" class="active">Violino</a>
                        <a href="#">Viola</a>
                        <a href="#">Violoncelo</a>
                    </div>
                </div>
                <ul class="nav-menu" id="nav-menu">
                    <li><a href="index.html">Home</a></li>
                    
                    <li class="nav-item-dropdown">
                        <a href="javascript:void(0);">Cordas▾</a>
                        <div class="dropdown-content">
                            <a href="lista-de-cordas.html">Catálogo (Lista)</a>
                            <a href="comparador-de-cordas.html">Comparar Cordas</a>
                            <a href="guia-de-cordas.html">Gráfico de Cordas</a>
                        </div>
                    </li>
                    
                    <li><a href="fisica-do-som.html">Física do Som</a></li>
                    <li><a href="importacao.html">Importação</a></li>
                    <li><a href="recomendados.html">Recomendados</a></li>
                    <li><a href="contatos.html">Contatos</a></li>
                </ul>
                <div class="header-controls">
                    <div class="lang-dropdown" id="lang-dropdown">
                        <button class="lang-btn" id="lang-btn" aria-label="Mudar idioma">
                            <div class="flag-split">
                                <img src="https://flagcdn.com/pt.svg" alt="PT">
                                <img src="https://flagcdn.com/br.svg" alt="BR">
                            </div>
                        </button>
                        <div class="lang-content">
                            <a href="#"><div class="flag-split" style="width:24px;height:16px;"><img src="https://flagcdn.com/pt.svg"><img src="https://flagcdn.com/br.svg"></div> PT/BR</a>
                            <a href="es/index.html"><div class="flag-split" style="width:24px;height:16px;"><img src="https://flagcdn.com/es.svg"><img src="https://flagcdn.com/ar.svg"></div> ES/AR</a>
                            <a href="en/index.html"><div class="flag-split" style="width:24px;height:16px;"><img src="https://flagcdn.com/gb.svg"><img src="https://flagcdn.com/us.svg"></div> EN/US</a>
                        </div>
                    </div>
                    <button id="theme-toggle" class="theme-toggle" aria-label="Mudar tema"></button>
                    <button id="mobile-menu-btn" class="mobile-menu-btn">
                        <svg viewBox="0 0 24 24" width="28" height="28" stroke="currentColor" fill="none" stroke-width="2">
                            <line x1="3" y1="12" x2="21" y2="12"></line>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <line x1="3" y1="18" x2="21" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </nav>
        </header>
    `;

    // 2. Constrói o Footer, Botão Flutuante e Modal Pix
    const footerHTML = `
        <a href="https://chat.whatsapp.com/FXtRa6sLL4W5d136xMze7r" class="whatsapp-float" target="_blank" aria-label="Comunidade VIP WhatsApp"> 
            <img src="NKL/wpplogo.w70-h70-c1.png" loading="lazy" alt="WhatsApp"> 
        </a>
        <footer class="site-footer">
            <div class="footer-header">
                <h3>Receba o PDF completo em Alta Resolução do Gráfico de Cordas</h3>
                <p>Deixe o seu contato para enviarmos o material de estudo diretamente para você.</p>
                <form id="form-captura" class="capture-form" action="https://formspree.io/f/maqzkwwb" method="POST">
                    <input type="text" name="name" class="capture-input" placeholder="Seu nome" required>
                    <input type="email" name="email" class="capture-input" placeholder="Escreva o seu e-mail principal" required>
                    <button type="submit" class="capture-btn">Confirmar</button>
                </form>
            </div>
            <div class="footer-grid">
                <div class="footer-box">
                    <h4>Sua voz importa</h4>
                    <p>Ajude a construir o melhor<br>portal de violino do Brasil.</p>
                    <a href="https://forms.gle/mcfnxfXuF7bmuhPDA" target="_blank" class="btn-outline">Deixar Feedback Rápido</a>
                </div>
                <div class="footer-box">
                    <h4>Contato Direto</h4>
                    <p>Dúvidas, parcerias ou projetos pessoais?<br>Mande-nos um e-mail.</p>
                    <a href="mailto:contato.nikoluthieria@gmail.com" class="btn-outline">contato.nikoluthieria@gmail.com</a>
                </div>
                <div class="footer-box">
                    <h4>Apoie o Projeto</h4>
                    <p>Todo o conteúdo gratuito exige pesquisa.<br>Apoie nossa estrutura.</p>
                    <div style="display: flex; gap: 10px; width: 100%;">
                        <a href="https://link.mercadopago.com.br/apoienkloficial" target="_blank" class="btn-outline" style="flex: 1;">Apoiar NKL</a>
                        <button onclick="document.getElementById('pix-modal').classList.add('show')" class="btn-outline" style="flex: 1;">❖ PayPal</button>
                    </div>
                </div>
            </div>
            <div class="footer-bottom">
                &copy; Copyright 2026 | NKL | Todos direitos reservados
            </div>
        </footer>
        <div id="pix-modal" class="modal-overlay" onclick="closePixModal()">
            <div class="modal-content" onclick="event.stopPropagation()">
                <button class="close-btn" onclick="closePixModal()">&times;</button>
                <h4 style="font-family: 'Playfair Display', serif; font-size: 1.2rem; margin-bottom: 0.5rem; color: var(--text);">Apoiar o NKL pelo PayPal</h4>
                <p style="font-size: 0.8rem; opacity: 0.7; margin-bottom: 1.2rem; color: var(--text);">Escaneie o código abaixo para apoiar a manutenção do nosso Portal.</p>
                <img src="NKL/1000343886.webp" style="width: 100%; max-width: 220px; height: auto; display: block; margin: 0 auto; border-radius: 8px; border: 1px solid var(--border);" alt="QR Code PayPal">
            </div>
        </div>
    `;

    // 3. Injeta no DOM
    document.body.insertAdjacentHTML('afterbegin', headerHTML);
    document.body.insertAdjacentHTML('beforeend', footerHTML);

    // 4. Lógica de "Menu Ativo" Inteligente
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        link.classList.remove('active'); // Limpa estados anteriores

        if (linkPath === currentPath) {
            link.classList.add('active'); // Marca o link atual

            // Se o link for um sub-item (ex: Gráfico de Cordas), acende o botão "Cordas" pai
            const parentDropdown = link.closest('.nav-item-dropdown');
            if (parentDropdown) {
                const dropBtn = parentDropdown.querySelector('a');
                if (dropBtn) dropBtn.classList.add('active');
            }
        }
    });
}
// Dispara a injeção imediatamente
injectGlobalLayout();

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
            if (dynamicBg) {
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
// 3. SMART HEADER (Esconde ao descer, mostra ao subir)
// =======================================================================
let lastScrollTop = 0;
const scrollDelta = 5; // Amortecedor: Ignora micro-tremidas de mouse/touchpad

window.addEventListener('scroll', function () {
    const header = document.getElementById('site-header');
    const navMenu = document.getElementById('nav-menu');
    const profile = document.querySelector('.profile'); // Usado na página de Contatos

    if (!header) return;

    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;

    // Foto do contato some
    if (profile) {
        currentScroll > 50 ? profile.classList.add('esconder') : profile.classList.remove('esconder');
    }

    // SEGURANÇA: Se a rolagem for menor que 5px, nem esquenta a cabeça, ignora.
    if (Math.abs(lastScrollTop - currentScroll) <= scrollDelta) {
        return;
    }

    // Lógica do Cabeçalho
    if (currentScroll > lastScrollTop && currentScroll > 80) {
        // ROLOU PARA BAIXO: Esconde o cabeçalho
        header.classList.add('hide');
        if (navMenu) navMenu.classList.remove('show');
    }
    else if (currentScroll < lastScrollTop) {
        // ROLOU PARA CIMA: Mostra o cabeçalho imediatamente
        header.classList.remove('hide');
    }

    // Atualiza a posição (o <= 0 evita o bug de "elástico" da Apple)
    lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
}, { passive: true }); // passive: true deixa a rolagem da página muito mais leve no celular

// =======================================================================
// 4. CONTROLES DE CLIQUES (MENUS E DROPDOWNS)
// =======================================================================
const logoBtn = document.getElementById('logo-btn');
const logoContainer = document.getElementById('logo-dropdown-container');
const langBtn = document.getElementById('lang-btn');
const langDropdown = document.getElementById('lang-dropdown');
const cordasItem = document.querySelector('.nav-item-dropdown');

// Abrir Dropdown da Logo (Instrumentos)
if (logoBtn) {
    logoBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Evita que o clique vaze pro site inteiro e feche o menu na mesma hora
        logoContainer.classList.toggle('show-dropdown');
        if (langDropdown) langDropdown.classList.remove('show-lang');
        if (cordasItem) cordasItem.classList.remove('show-click');
    });
}

// Abrir Dropdown de Idiomas (Bandeiras)
if (langBtn) {
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langDropdown.classList.toggle('show-lang');
        if (logoContainer) logoContainer.classList.remove('show-dropdown');
        if (cordasItem) cordasItem.classList.remove('show-click');
    });
}

// Abrir Menu de Cordas (Gráfico e Comparador)
if (cordasItem) {
    const cordasBtn = cordasItem.querySelector('a');
    cordasBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cordasItem.classList.toggle('show-click');
        if (logoContainer) logoContainer.classList.remove('show-dropdown');
        if (langDropdown) langDropdown.classList.remove('show-lang');
    });
}

// Escuta cliques no site todo: se clicar fora de um menu, fecha todos eles.
document.addEventListener('click', () => {
    if (logoContainer) logoContainer.classList.remove('show-dropdown');
    if (langDropdown) langDropdown.classList.remove('show-lang');
    if (cordasItem) cordasItem.classList.remove('show-click');
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
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        body.classList.toggle('dark-theme');
        // Salva a decisão no cache do navegador para manter quando trocar de aba
        localStorage.setItem('nkl_theme', body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
}


// =======================================================================
// 6. MENU MOBILE (BOTÃO HAMBÚRGUER) - 100% BLINDADO
// =======================================================================
document.addEventListener('click', (e) => {
    // Verifica se o elemento clicado foi o botão ou o desenho (svg) dentro dele
    const btnMobile = e.target.closest('#mobile-menu-btn');
    const navMenuEl = document.getElementById('nav-menu');

    // Se o usuário clicou EXATAMENTE no botão hambúrguer
    if (btnMobile) {
        e.preventDefault(); 
        e.stopPropagation(); // Trava o clique para não acionar bugs
        
        if (navMenuEl) {
            navMenuEl.classList.toggle('show');
        }
    } 
    // Se o menu estiver aberto e o usuário clicar FORA dele na tela (Bônus de UX)
    else if (navMenuEl && navMenuEl.classList.contains('show')) {
        if (!e.target.closest('#nav-menu')) {
            navMenuEl.classList.remove('show');
        }
    }
});

// =======================================================================
// 7. MODAIS (POP-UPS DE PAYPAL E OUTROS)
// =======================================================================
// Fecha o modal de contribuição
function closePixModal() {
    const pixModal = document.getElementById('pix-modal');
    if (pixModal) pixModal.classList.remove('show');
}


// =======================================================================
// 8. ENVIO DE E-MAIL (FORMSPREE + SISTEMA ANTI-SPAM)
// =======================================================================
const formCaptura = document.getElementById('form-captura');

if (formCaptura) {
    formCaptura.addEventListener('submit', function (event) {
        event.preventDefault(); // Trava o redirecionamento automático da página

        const btn = formCaptura.querySelector('.capture-btn');

        // SEGURANÇA: Se o botão estiver desativado, ignora o clique (impede duplo clique / spam local)
        if (btn.disabled) return;

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
    if (!modal) return;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Trava o fundo

    const container = modal.querySelector('.carousel-container');
    const items = container.querySelectorAll('.carousel-item');

    // Pula direto para a foto clicada
    if (items[startIndex]) {
        container.style.scrollBehavior = 'auto';
        container.scrollLeft = items[startIndex].offsetLeft;
        setTimeout(() => { container.style.scrollBehavior = 'smooth'; }, 50);
    }
}

// Fecha a galeria e pausa os vídeos
function closeCarousel(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.remove('active');
    document.body.style.overflow = 'auto'; // Destrava o fundo

    // Pausa os vídeos quando fecha
    const videos = modal.querySelectorAll('video');
    videos.forEach(v => v.pause());
}

// Lógica de rolar pro lado ou abrir Instagram
function scrollCarousel(containerId, direction, instaLink) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const scrollAmount = container.clientWidth;

    // Se clicou ESQUERDA (-1) e já tá no começo, abre o Insta
    if (direction === -1 && container.scrollLeft <= 5) {
        if (instaLink) window.open(instaLink, '_blank');
        return;
    }

    // Se clicou DIREITA (1) e já tá no fim, abre o Insta
    if (direction === 1 && (container.scrollLeft + container.clientWidth >= container.scrollWidth - 5)) {
        if (instaLink) window.open(instaLink, '_blank');
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
/// =======================================================================
// TRANSIÇÃO ORGÂNICA (CONTEÚDO PARA UM LADO, FUNDO CONTÍNUO PARA O OUTRO)
// =======================================================================

// 1. GATILHO INSTANTÂNEO DE ENTRADA (Mata o "piscar" e fundo parado)
// Executa milissegundos antes da página renderizar na tela

