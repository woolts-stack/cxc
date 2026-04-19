// js/mapa.js

// 1. FUNÇÃO QUE CARREGA O SVG
async function renderizarMapa() {
    const container = document.getElementById('svg-mapa-container');
    
    try {
        const resposta = await fetch('mundo.svg');
        if (!resposta.ok) throw new Error("Arquivo mundo.svg não encontrado na pasta!");
        
        const svgHTML = await resposta.text();
        container.innerHTML = svgHTML;

        prepararMapaInterativo();
        
        // Ativa o sistema de Zoom e Arrastar
        aplicarNavegacaoMapa();

    } catch (erro) {
        container.innerHTML = `<p style="color:red; text-align:center; padding:50px;">ERRO: ${erro.message}</p>`;
    }
}

// 2. FUNÇÃO QUE PINTA OS PAÍSES E ADICIONA OS CLIQUES
function prepararMapaInterativo() {
    const pathsPaises = document.querySelectorAll('#svg-mapa-container svg path');

    pathsPaises.forEach(path => {
        const sigla = path.getAttribute('id')?.toUpperCase(); 
        let nomePais = "Desconhecido";
        let relacao = 50;

        for (let chave in dbPaises) {
            if (dbPaises[chave].id === sigla) {
                nomePais = chave;
                relacao = dbPaises[chave].diplomacia?.relacao || 50;
                break;
            }
        }

        if (nomePais !== "Desconhecido") {
            path.style.fill = calcularCorRelacao(relacao);
            path.style.cursor = "pointer";
            path.addEventListener('click', (event) => cliquePais(event, nomePais));
            path.addEventListener('mouseenter', () => path.style.filter = 'brightness(1.5)');
            path.addEventListener('mouseleave', () => path.style.filter = 'none');
        } else {
            path.style.fill = "#1a2530"; 
        }
    });
}

function calcularCorRelacao(relacao) {
    if (relacao > 50) {
        const intensidade = (relacao - 50) * 5; 
        return `rgb(0, ${intensidade + 100}, 100)`;
    } else {
        const intensidade = (50 - relacao) * 5;
        return `rgb(${intensidade + 100}, 0, 50)`;
    }
}

function cliquePais(event, nome) {
    const tooltip = document.getElementById('map-tooltip');
    const containerMapa = document.getElementById('svg-mapa-container').getBoundingClientRect();
    const dados = dbPaises[nome];
    
    let posX = event.clientX - containerMapa.left + 15;
    let posY = event.clientY - containerMapa.top + 15;
    
    if (posX > containerMapa.width - 180) posX -= 190;
    if (posY > containerMapa.height - 150) posY -= 160;

    tooltip.style.left = posX + "px";
    tooltip.style.top = posY + "px";
    
    document.getElementById('tooltip-nome').innerText = nome.toUpperCase();
    document.getElementById('tooltip-relacao').innerText = dados?.diplomacia?.relacao || 50;
    
    tooltip.classList.remove('oculto');
}

// ==========================================
// 3. SISTEMA DE NAVEGAÇÃO (ZOOM E ARRASTAR)
// ==========================================
let zoomAtual = 1;
let estaArrastando = false;
let posX = 0, posY = 0;
let startX = 0, startY = 0;

function aplicarNavegacaoMapa() {
    const container = document.getElementById('svg-mapa-container');

    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const sensibilidade = 0.1;
        zoomAtual = (e.deltaY < 0) ? zoomAtual + sensibilidade : zoomAtual - sensibilidade;
        zoomAtual = Math.min(Math.max(0.5, zoomAtual), 5);
        atualizarTransform();
    });

    container.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'path') return;
        estaArrastando = true;
        startX = e.clientX - posX;
        startY = e.clientY - posY;
    });

    window.addEventListener('mousemove', (e) => {
        if (!estaArrastando) return;
        posX = e.clientX - startX;
        posY = e.clientY - startY;
        atualizarTransform();
    });

    window.addEventListener('mouseup', () => { estaArrastando = false; });
}

function atualizarTransform() {
    const svg = document.querySelector('#svg-mapa-container svg');
    if(svg) {
        svg.style.transform = `translate(${posX}px, ${posY}px) scale(${zoomAtual})`;
    }
}

// Fechar balão ao clicar fora
document.addEventListener('click', (e) => {
    if (e.target.tagName !== 'path' && !e.target.closest('#map-tooltip')) {
        document.getElementById('map-tooltip').classList.add('oculto');
    }
});