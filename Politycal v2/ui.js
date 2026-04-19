// ============================================================
// POLITYCAL | ui/ui.js
// RENDERIZADOR — Apenas lê GameState e atualiza o DOM.
//
// REGRA: Este arquivo NÃO calcula nada. Nunca. Só exibe.
// Todo cálculo está nos módulos de core/.
// ============================================================

const UI = (() => {

    // Utilitário: atualiza texto de um elemento com segurança
    const $set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    // ── TELA DE PRÉ-JOGO ─────────────────────────────────────

    function inicializarPreJogo() {
        const seletor = document.getElementById('selecao-pais');
        if (!seletor) return;

        seletor.innerHTML = '';
        Object.entries(dbPaises).forEach(([chave, pais]) => {
            const opt = document.createElement('option');
            opt.value = chave;
            opt.text  = `${pais.nome} (${pais.id?.toUpperCase() ?? '?'})`;
            seletor.appendChild(opt);
        });

        seletor.addEventListener('change', atualizarPreview);
        atualizarPreview();
    }

    function atualizarPreview() {
        const chave = document.getElementById('selecao-pais')?.value;
        const pais  = dbPaises[chave];
        if (!pais) return;

        $set('nome-pais-label', pais.nome.toUpperCase());
        $set('pib-valor',  `$${pais.economia.pib}B`);
        $set('pop-valor',  `${pais.recursos.populacao}M`);
        $set('mil-valor',  `${(pais.militar.efetivo / 1000).toFixed(0)}K`);
    }

    // ── TELA PRINCIPAL ────────────────────────────────────────

    function renderizarTopBar() {
        $set('jogo-nome-pais',    GameState.get('paisJogador') ? dbPaises[GameState.get('paisJogador')]?.nome?.toUpperCase() ?? '---' : '---');
        $set('jogo-data',         GameState.getDataFormatada());
        $set('jogo-tesouro',      `$${GameState.get('economia.tesouro')?.toFixed(1) ?? 0}B`);
        $set('jogo-crescimento',  `${GameState.get('economia.crescimento')?.toFixed(1) ?? 0}%`);
        $set('jogo-pop',          `${GameState.get('recursos.populacao') ?? 0}M`);
        $set('jogo-ouro',         `${GameState.get('recursos.ouro') ?? 0}t`);
        $set('jogo-uranio',       `${GameState.get('recursos.uranio') ?? 0}t`);
        $set('jogo-inflacao',     `${GameState.get('economia.inflacao')?.toFixed(1) ?? 0}%`);
        $set('jogo-popularidade', `${GameState.get('politica.popularidade')?.toFixed(0) ?? 0}%`);
        $set('jogo-estabilidade', `${GameState.get('politica.estabilidade')?.toFixed(0) ?? 0}%`);
        $set('jogo-poder',        `${GameState.get('politica.poder')?.toFixed(0) ?? 0}`);

        // Alerta de crise no painel lateral
        const estab = GameState.get('politica.estabilidade') ?? 100;
        const alerta = document.getElementById('status-alerta');
        if (alerta) {
            if (estab < 30) {
                alerta.textContent = '⚠️ CRISE POLÍTICA ATIVA';
                alerta.className   = 'status-alerta vermelho';
            } else if (estab < 55) {
                alerta.textContent = '⚡ INSTABILIDADE MODERADA';
                alerta.className   = 'status-alerta amarelo';
            } else {
                alerta.textContent = '✅ SITUAÇÃO ESTÁVEL';
                alerta.className   = 'status-alerta verde';
            }
        }
    }

    // ── SISTEMA DE ABAS ───────────────────────────────────────

    function abrirAba(idAba, botaoClicado) {
        document.querySelectorAll('.aba-conteudo').forEach(a => a.classList.add('oculto'));
        document.querySelectorAll('.btn-acao').forEach(b => b.classList.remove('ativo'));

        document.getElementById(idAba)?.classList.remove('oculto');
        botaoClicado?.classList.add('ativo');

        GameState.set('telaAtiva', idAba);
        GameState.emit('abaAberta', { idAba });
    }

    // ── CENTRAL DE NOTÍCIAS ───────────────────────────────────

    function abrirModalNoticias() {
        const modal = document.getElementById('modal-noticias');
        if (!modal) return;
        modal.classList.remove('oculto');
        _renderizarLogNoModal();
    }

    function fecharModalNoticias() {
        document.getElementById('modal-noticias')?.classList.add('oculto');
    }

    function _renderizarLogNoModal() {
        const corpo = document.getElementById('modal-body-geral');
        if (!corpo) return;

        const eventos = GameState.raw().eventos.slice(0, 50);
        if (eventos.length === 0) {
            corpo.innerHTML = '<p style="opacity:0.5;text-align:center;">Nenhum evento registrado ainda.</p>';
            return;
        }

        const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
        corpo.innerHTML = eventos.map(e => {
            const cor = e.tipo === 'SUCESSO' ? '#39ff14' : e.tipo === 'CRISE' ? '#ff4444' : '#00f2ff';
            return `<div class="alerta-noticia" style="border-color:${cor}">
                <span class="data-noticia">[${MESES[e.mes]} ${e.ano}]</span>
                ${e.mensagem}
            </div>`;
        }).join('');
    }

    // ── TICKER DE NOTÍCIAS ────────────────────────────────────

    function atualizarTicker() {
        const ticker = document.getElementById('ticker-content');
        if (!ticker) return;

        const ultimos = GameState.raw().eventos.slice(0, 5);
        if (ultimos.length === 0) return;

        ticker.innerHTML = ultimos.map(e => {
            const icone = e.tipo === 'SUCESSO' ? '📈' : e.tipo === 'CRISE' ? '🔴' : '📌';
            return `<span class="news-item">${icone} ${e.mensagem}</span>`;
        }).join('');
    }

    // ── REGISTRO DE LISTENERS ─────────────────────────────────
    // Conecta os eventos do GameState à renderização.
    // Toda vez que algo muda no jogo, a UI atualiza automaticamente.

    function registrarListeners() {
        // Após cada turno: atualiza top bar e ticker
        GameState.on('turnoProcessado', () => {
            renderizarTopBar();
            atualizarTicker();
        });

        // Novos eventos: atualiza ticker em tempo real
        GameState.on('novoEvento', () => {
            atualizarTicker();
        });

        // Quando o jogo inicia
        GameState.on('jogoIniciado', () => {
            document.getElementById('interface-pre-jogo')?.classList.add('oculto');
            document.getElementById('interface-jogo')?.classList.remove('oculto');
            renderizarTopBar();
            Mapa.carregar();
        });
    }

    // ── INICIALIZAÇÃO ─────────────────────────────────────────

    function init() {
        registrarListeners();

        // Pré-jogo
        document.addEventListener('DOMContentLoaded', () => {
            inicializarPreJogo();

            // Botão iniciar
            document.getElementById('btn-iniciar')?.addEventListener('click', () => {
                const chave = document.getElementById('selecao-pais')?.value;
                if (!chave) return;
                GameState.inicializar(chave); // Dispara 'jogoIniciado'
            });

            // Botão próximo mês
            document.getElementById('btn-passar-turno')?.addEventListener('click', () => {
                Motor.avancarTurno(); // Motor processa, GameState emite 'turnoProcessado', UI reage
            });

            // Ticker
            document.querySelector('.news-ticker-container')?.addEventListener('click', abrirModalNoticias);
        });
    }

    return {
        init,
        renderizarTopBar,
        abrirAba,
        abrirModalNoticias,
        fecharModalNoticias,
    };
})();

// Inicializa automaticamente
UI.init();
window.UI = UI;
