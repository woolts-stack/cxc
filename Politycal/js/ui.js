// js/ui.js

// ==========================================
// 1. ESTADO GLOBAL DO JOGO
// ==========================================
let estadoJogo = {
    paisJogador: null,
    emPartida: false
};

// ==========================================
// 2. TELA DE LOGIN (PRÉ-JOGO)
// ==========================================

// Preenche a listinha de países
function preencherSeletor() {
    const seletor = document.getElementById('selecao-pais');
    if (!seletor) return;

    seletor.innerHTML = "";
    seletor.style.width = "100%";
    seletor.style.padding = "10px";
    seletor.style.marginTop = "10px";
    seletor.style.background = "rgba(0,0,0,0.5)";
    seletor.style.color = "#00f2ff";
    seletor.style.border = "1px solid #00f2ff";

    for (let chavePais in dbPaises) {
        const pais = dbPaises[chavePais];
        const option = document.createElement('option');
        option.value = chavePais; 
        option.text = `${pais.nome} (${pais.id})`; 
        seletor.appendChild(option);
    }
}

// Atualiza a caixinha verde ANTES de iniciar
function atualizarPreview() {
    const nomeSelecionado = document.getElementById('selecao-pais').value;
    const dadosPais = dbPaises[nomeSelecionado];

    if (dadosPais) {
        document.getElementById('nome-pais-label').innerText = dadosPais.nome.toUpperCase();
        document.getElementById('pib-valor').innerText = dadosPais.economia.pib + "T";
        document.getElementById('pop-valor').innerText = dadosPais.recursos.populacao + "M";
        document.getElementById('mil-valor').innerText = dadosPais.militar.efetivo + "K";
    }
}

// Quando abre a página
document.addEventListener("DOMContentLoaded", () => {
    preencherSeletor(); 
    atualizarPreview(); 
});

// Botão Assumir Comando
document.getElementById('btn-iniciar').addEventListener('click', () => {
    const nomeSelecionado = document.getElementById('selecao-pais').value;
    
    estadoJogo.paisJogador = nomeSelecionado;
    estadoJogo.emPartida = true;

    document.getElementById('interface-pre-jogo').classList.add('oculto');
    document.getElementById('interface-jogo').classList.remove('oculto');

    renderizarMapa(); // <--- ESTA É A LINHA NOVA MÁGICA!
    atualizarInterfaceJogo(); 
});


// ==========================================
// 3. TELA PRINCIPAL (MESA DE COMANDO)
// ==========================================

// ATENÇÃO: Esta é a única atualizarInterfaceJogo() que deve existir agora!
function atualizarInterfaceJogo() {
    const pais = dbPaises[estadoJogo.paisJogador];
    
    document.getElementById('jogo-nome-pais').innerText = pais.nome.toUpperCase();
    document.getElementById('jogo-tesouro').innerText = pais.economia.tesouro.toFixed(2);
    document.getElementById('jogo-crescimento').innerText = pais.economia.crescimento.toFixed(1);
    
    // Dados Expandidos
    document.getElementById('jogo-pop').innerText = pais.recursos.populacao;
    document.getElementById('jogo-ouro').innerText = pais.recursos.ouro || 0;
    document.getElementById('jogo-uranio').innerText = pais.recursos.uranio || 0;
    
    // Data
    const mesFormatado = engineJogo.nomesMeses[engineJogo.mesAtual].toUpperCase();
    document.getElementById('jogo-data').innerText = `${mesFormatado} ${engineJogo.anoAtual}`;
}

// Botão de Avançar o Turno
const btnPassarTurno = document.getElementById('btn-passar-turno');
if(btnPassarTurno) {
    btnPassarTurno.addEventListener('click', () => {
        processarPassagemTurno(); 
        atualizarInterfaceJogo(); 
    });
}

// ==========================================
// 4. SISTEMA DE ABAS (MAPA, ECONOMIA, ETC)
// ==========================================
function abrirAba(idAbaDesejada, botaoClicado) {
    const abas = document.querySelectorAll('.aba-conteudo');
    abas.forEach(aba => {
        aba.classList.add('oculto');
    });

    document.getElementById(idAbaDesejada).classList.remove('oculto');

    const botoes = document.querySelectorAll('.btn-acao');
    botoes.forEach(btn => {
        btn.classList.remove('ativo');
    });

    botaoClicado.classList.add('ativo');
}

// ==========================================
// 5. CENTRAL DE NOTÍCIAS (TICKER E MODAL)
// ==========================================
function abrirModalNoticias() {
    document.getElementById('modal-noticias').classList.remove('oculto');
}

function fecharModalNoticias() {
    document.getElementById('modal-noticias').classList.add('oculto');
}