// js/mapa.js

let filtroAtual = 'diplomacia'; 
let zoomAtual = 1;
let estaArrastando = false;
let posX = 0, posY = 0;
let startX = 0, startY = 0;

// 1. CARREGAR O MAPA
async function renderizarMapa() {
    const container = document.getElementById('svg-mapa-container');
    try {
        const resposta = await fetch('mundo.svg');
        const svgHTML = await resposta.text();
        container.innerHTML = svgHTML;
        prepararMapaInterativo();
        aplicarNavegacaoMapa();
    } catch (erro) {
        console.error("Erro ao carregar o mapa:", erro);
    }
}

// 2. PINTAR E CONFIGURAR CLIQUES
function prepararMapaInterativo() {
    const pathsPaises = document.querySelectorAll('#svg-mapa-container svg path');
    pathsPaises.forEach(path => {
        let nomePais = descobrirNomeDoPais(path);
        if (nomePais !== "Desconhecido") {
            const dados = dbPaises[nomePais];
            path.style.fill = calcularCorPorFiltro(dados, filtroAtual);
            path.style.cursor = "pointer";
            
            path.onclick = (event) => cliquePais(event, nomePais);
            path.onmouseenter = () => path.style.filter = 'brightness(1.5)';
            path.onmouseleave = () => path.style.filter = 'none';
        } else {
            path.style.fill = "#1a2530"; 
        }
    });
}

// 3. LÓGICA DOS FILTROS
function mudarFiltroMapa(novoFiltro) {
    filtroAtual = novoFiltro;
    prepararMapaInterativo(); 
}

function calcularCorPorFiltro(dados, filtro) {
    if (!dados) return "#1a2530";
    switch(filtro) {
        case 'global': return "#88A4BC";
        case 'diplomacia':
            const rel = dados.diplomacia?.relacao || 50;
            if (rel > 50) return `rgb(0, ${(rel - 50) * 5 + 100}, 0)`; 
            if (rel < 50) return `rgb(${(50 - rel) * 5 + 100}, 0, 0)`; 
            return "#f1c40f"; 
        case 'riqueza':
            const pib = dados.economia?.pib || 0;
            const brilho = Math.min(pib * 50, 200); 
            return `rgb(0, ${brilho}, ${brilho + 50})`; 
        case 'crescimento':
            return (dados.economia?.crescimento || 0) >= 0 ? "#27ae60" : "#c0392b";
        default: return "#1a2530";
    }
}

// 4. MODO EXPANDIR
function toggleMapaExpandido() {
    const isExpanding = !document.body.classList.contains('mapa-focado');
    
    document.body.classList.toggle('mapa-focado');
    document.getElementById('btn-fechar-expandido').classList.toggle('oculto');
    
    // Se estiver expandindo, reseta posição para o centro
    if (isExpanding) {
        zoomAtual = 1;
        posX = 0;
        posY = 0;
    }
    
    // Pequeno atraso para o CSS aplicar antes de redesenhar
    setTimeout(() => {
        atualizarTransform();
    }, 50);
}

// 5. DETECTAR NOME DO PAÍS
function descobrirNomeDoPais(path) {
    let elemento = path;
    let possiveisNomes = new Set();
    while (elemento && elemento.tagName && elemento.tagName.toLowerCase() !== 'svg') {
        let id = (elemento.getAttribute('id') || "").toUpperCase();
        let cls = (elemento.getAttribute('class') || "").toUpperCase();
        let name = (elemento.getAttribute('name') || "").toUpperCase();
        if (id) possiveisNomes.add(id);
        if (cls) possiveisNomes.add(cls);
        if (name) possiveisNomes.add(name);
        elemento = elemento.parentNode;
    }
    const apelidos = { "RUSSIAN FEDERATION": "RU", "UNITED STATES": "US" };
    for (let pista of possiveisNomes) {
        let limpa = pista.split('-')[0].split('_')[0];
        let idFinal = apelidos[pista] || limpa;
        for (let chave in dbPaises) {
            if (idFinal === dbPaises[chave].id.toUpperCase() || pista === chave.toUpperCase()) return chave;
        }
    }
    return "Desconhecido";
}

// 6. NAVEGAÇÃO
function aplicarNavegacaoMapa() {
    const container = document.getElementById('svg-mapa-container');
    container.onwheel = (e) => {
        e.preventDefault();
        zoomAtual = (e.deltaY < 0) ? zoomAtual + 0.1 : zoomAtual - 0.1;
        zoomAtual = Math.min(Math.max(0.5, zoomAtual), 5);
        atualizarTransform();
    };
}

function atualizarTransform() {
    const svg = document.querySelector('#svg-mapa-container svg');
    if(svg) svg.style.transform = `translate(${posX}px, ${posY}px) scale(${zoomAtual})`;
}