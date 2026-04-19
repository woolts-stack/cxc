// ============================================================
// POLITYCAL | core/state.js
// FONTE ÚNICA DE VERDADE — Observer Pattern
//
// REGRA DE OURO: Nenhum módulo chama outro diretamente.
// Todos ESCUTAM eventos e ATUALIZAM o estado via GameState.
// A UI apenas reflete o que está no estado. Jamais o contrário.
// ============================================================

const GameState = (() => {

    // ── O ÚNICO OBJETO DE ESTADO DO JOGO ─────────────────────
    let _state = {
        // Controle temporal
        mes: 0,   // 0 = Janeiro ... 11 = Dezembro
        ano: 2026,
        turno: 0,

        // Identidade
        paisJogador: null,
        emPartida: false,
        telaAtiva: 'tela-mapa',

        // Finanças (espelho mutável de mundo.js — NÃO altere o mundo.js original)
        economia: {
            pib: 0,
            crescimento: 0,
            tesouro: 0,
            dividaPib: 60,
            inflacao: 4.5,
            impostoPct: 25,
        },

        // Atributos políticos (0–100)
        politica: {
            popularidade: 60,
            estabilidade: 70,
            poder: 50,
        },

        // Recursos estratégicos
        recursos: {
            populacao: 0,
            ouro: 0,
            uranio: 0,
            petroleo: 0,
        },

        // Capacidade militar
        militar: {
            efetivo: 0,
            tecnologia: 50,
            prontidao: 40,
            gastosPib: 1.5,
        },

        // Estado do mapa
        mapa: {
            filtro: 'diplomacia',
            zoom: 1,
            posX: 0,
            posY: 0,
            paisSelecionado: null,
        },

        // Log de eventos (máx. 200 entradas, mais recente primeiro)
        eventos: [],

        // Séries temporais para gráficos (máx. 120 pontos = 10 anos)
        historico: {
            labels: [],
            pib: [],
            estabilidade: [],
            divida: [],
        },
    };

    // ── BARRAMENTO DE EVENTOS (Event Bus) ────────────────────
    const _listeners = {};

    // ── API PÚBLICA ──────────────────────────────────────────
    return {

        // Lê um valor via caminho com ponto: get('economia.pib')
        get(caminho) {
            return caminho.split('.').reduce((obj, k) => obj?.[k], _state);
        },

        // Escreve um único valor: set('economia.pib', 2500)
        set(caminho, valor) {
            const chaves = caminho.split('.');
            let obj = _state;
            for (let i = 0; i < chaves.length - 1; i++) obj = obj[chaves[i]];
            obj[chaves[chaves.length - 1]] = valor;
            this.emit('mudanca', { caminho, valor });
        },

        // Atualiza múltiplos campos de uma seção de uma vez (eficiente)
        // patch('economia', { pib: 2600, crescimento: 3.1 })
        patch(secao, objeto) {
            Object.assign(_state[secao], objeto);
            this.emit('mudanca', { secao, objeto });
        },

        // Retorna cópia superficial de uma seção inteira
        section(nome) {
            return { ..._state[nome] };
        },

        // Acesso direto ao estado bruto (somente leitura, use com cautela)
        raw() { return _state; },

        // ── SISTEMA DE EVENTOS ────────────────────────────────

        // Registra um listener: on('turnoProcessado', fn)
        on(evento, callback) {
            if (!_listeners[evento]) _listeners[evento] = [];
            _listeners[evento].push(callback);
        },

        // Emite um evento para todos os listeners registrados
        emit(evento, dados) {
            (_listeners[evento] || []).forEach(cb => {
                try { cb(dados); } catch(e) { console.error(`[GameState] Erro no listener '${evento}':`, e); }
            });
        },

        // ── INICIALIZAÇÃO A PARTIR DO BANCO DE DADOS ─────────

        inicializar(chavePais) {
            const pais = dbPaises?.[chavePais];
            if (!pais) {
                console.error(`[GameState] País '${chavePais}' não encontrado em dbPaises.`);
                return false;
            }

            _state.paisJogador = chavePais;
            _state.emPartida   = true;
            _state.mes         = 0;
            _state.ano         = 2026;
            _state.turno       = 0;

            // Copia dados imutáveis → estado mutável
            _state.economia = {
                pib:        pais.economia.pib        ?? 500,
                crescimento: pais.economia.crescimento ?? 2.5,
                tesouro:    pais.economia.tesouro    ?? 100,
                dividaPib:  pais.economia.dividaPib  ?? 60,
                inflacao:   pais.economia.inflacao   ?? 4.5,
                impostoPct: pais.economia.impostos   ?? 25,
            };

            _state.recursos = {
                populacao: pais.recursos.populacao ?? 0,
                ouro:      pais.recursos.ouro      ?? 0,
                uranio:    pais.recursos.uranio    ?? 0,
                petroleo:  pais.recursos.petroleo  ?? 0,
            };

            _state.militar = {
                efetivo:    pais.militar.efetivo    ?? 100000,
                tecnologia: pais.militar.tecnologia ?? 50,
                prontidao:  pais.militar.prontidao  ?? 40,
                gastosPib:  pais.militar.gastosPib  ?? 1.5,
            };

            // Limpa históricos para nova partida
            _state.historico = { labels: [], pib: [], estabilidade: [], divida: [] };
            _state.eventos = [];

            this.emit('jogoIniciado', { chavePais, pais });
            console.log(`[GameState] Partida iniciada como: ${pais.nome}`);
            return true;
        },

        // ── REGISTRO DE EVENTOS ───────────────────────────────

        addLog(mensagem, tipo = 'INFO') {
            // tipo: 'INFO' | 'SUCESSO' | 'CRISE' | 'ALERTA'
            const entry = {
                turno: _state.turno,
                mes:   _state.mes,
                ano:   _state.ano,
                mensagem,
                tipo,
                id: Date.now()
            };
            _state.eventos.unshift(entry);
            if (_state.eventos.length > 200) _state.eventos.pop();
            this.emit('novoEvento', entry);
        },

        // ── UTILIDADES DE TEMPO ───────────────────────────────

        getMesNome() {
            const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                           'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            return MESES[_state.mes];
        },

        getDataFormatada() {
            return `${this.getMesNome().toUpperCase()} ${_state.ano}`;
        },

        // Salva ponto no histórico de gráficos
        salvarHistorico() {
            const h = _state.historico;
            const label = `${this.getMesNome().slice(0,3)}/${String(_state.ano).slice(2)}`;
            h.labels.push(label);
            h.pib.push(+_state.economia.pib.toFixed(1));
            h.estabilidade.push(+_state.politica.estabilidade.toFixed(1));
            h.divida.push(+_state.economia.dividaPib.toFixed(2));
            // Janela deslizante de 120 pontos
            const MAX = 120;
            if (h.labels.length > MAX) {
                h.labels.shift(); h.pib.shift(); h.estabilidade.shift(); h.divida.shift();
            }
        },
    };
})();

// Disponível globalmente
window.GameState = GameState;
