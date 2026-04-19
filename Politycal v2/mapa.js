// ============================================================
// POLITYCAL | ui/mapa.js
// MÓDULO DO MAPA SVG — Renderização, filtros, navegação.
//
// Para adicionar um novo filtro: apenas adicione uma entrada
// ao objeto FILTROS abaixo. Zero mudanças em outros arquivos.
// ============================================================

const Mapa = (() => {

    // ── REGISTRO DE FILTROS (DATA-DRIVEN) ────────────────────
    // Para adicionar novo filtro: adicione aqui e coloque um botão no HTML.
    const FILTROS = {
        global: {
            label: 'Visão Global',
            cor: (dados) => '#5c6e7a',
        },
        diplomacia: {
            label: 'Diplomacia',
            cor: (dados) => {
                const rel = dados?.diplomacia?.relacao ?? 50;
                if (rel > 65) return `hsl(120, ${(rel-65)*3}%, 35%)`;   // verde
                if (rel < 35) return `hsl(0,   ${(35-rel)*3}%, 35%)`;   // vermelho
                return '#8a7a20'; // neutro amarelo
            },
        },
        riqueza: {
            label: 'Riqueza (PIB)',
            cor: (dados) => {
                const pib = dados?.economia?.pib ?? 0;
                const brilho = Math.min(pib / 3000 * 200, 200); // normaliza até 200
                return `rgb(0, ${Math.round(brilho)}, ${Math.round(brilho * 1.2)})`;
            },
        },
        crescimento: {
            label: 'Crescimento',
            cor: (dados) => {
                const c = dados?.economia?.crescimento ?? 0;
                return c >= 0 ? `hsl(120, 60%, ${20 + c * 5}%)` : `hsl(0, 60%, ${20 + Math.abs(c) * 5}%)`;
            },
        },
        populacao: {
            label: 'População',
            cor: (dados) => {
                const pop = dados?.recursos?.populacao ?? 0;
                const i = Math.min(pop / 1500 * 255, 255);
                return `rgb(${Math.round(i * 0.4)}, ${Math.round(i * 0.2)}, ${Math.round(i)})`;
            },
        },
    };

    // ── ESTADO INTERNO DO MAPA ────────────────────────────────
    let _zoom   = 1;
    let _posX   = 0;
    let _posY   = 0;
    let _drag   = false;
    let _startX = 0, _startY = 0;

    // ── 1. CARREGAR O SVG ─────────────────────────────────────
    async function carregar() {
        const container = document.getElementById('svg-mapa-container');
        if (!container) return;

        try {
            const res = await fetch('mundo.svg');
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            container.innerHTML = await res.text();
            _prepararPaises();
            _iniciarNavegacao();
            console.log('[Mapa] SVG carregado e pronto.');
        } catch (e) {
            console.error('[Mapa] Erro ao carregar SVG:', e);
            container.innerHTML = `<div style="color:#ff4444;padding:20px;">Erro ao carregar mapa. Verifique se mundo.svg está na raiz do projeto.</div>`;
        }
    }

    // ── 2. PINTAR PAÍSES ─────────────────────────────────────
    function _prepararPaises() {
        const filtroAtual = GameState.get('mapa.filtro') || 'diplomacia';
        const fn = FILTROS[filtroAtual]?.cor ?? FILTROS.global.cor;

        document.querySelectorAll('#svg-mapa-container path').forEach(path => {
            const nome  = _descobrirNome(path);
            const dados = dbPaises[nome];

            path.style.fill   = fn(dados);
            path.style.stroke = 'rgba(0,242,255,0.15)';
            path.style.strokeWidth = '0.5';
            path.style.cursor = dados ? 'pointer' : 'default';
            path.style.transition = 'filter 0.2s, stroke 0.2s';

            if (dados) {
                path.onmouseenter = () => {
                    path.style.filter = 'brightness(1.6)';
                    path.style.stroke = '#00f2ff';
                    path.style.strokeWidth = '1.5';
                };
                path.onmouseleave = () => {
                    path.style.filter = 'none';
                    path.style.stroke = 'rgba(0,242,255,0.15)';
                    path.style.strokeWidth = '0.5';
                };
                path.onclick = (ev) => _cliquePais(ev, nome, dados);
            }
        });
    }

    // ── 3. MUDAR FILTRO ───────────────────────────────────────
    function mudarFiltro(idFiltro) {
        if (!FILTROS[idFiltro]) return;
        GameState.set('mapa.filtro', idFiltro);
        _prepararPaises();
    }

    // ── 4. CLIQUE NO PAÍS — mostra tooltip ───────────────────
    function _cliquePais(event, nome, dados) {
        event.stopPropagation();
        const tooltip = document.getElementById('map-tooltip');
        if (!tooltip) return;

        const rel    = dados?.diplomacia?.relacao ?? 50;
        const status = dados?.diplomacia?.status  ?? 'Neutro';
        const pib    = dados?.economia?.pib ? `$${dados.economia.pib.toFixed(0)}B` : 'N/D';

        document.getElementById('tooltip-nome').textContent    = dados?.nome ?? nome;
        document.getElementById('tooltip-relacao').textContent = `${Math.round(rel)}%`;
        document.getElementById('tooltip-status').textContent  = status;
        document.getElementById('tooltip-pib').textContent     = pib;

        // Guarda o país selecionado para as ações dos botões do tooltip
        GameState.set('mapa.paisSelecionado', Object.keys(dbPaises).find(k => k === nome));

        // Posiciona tooltip perto do clique
        const container = document.getElementById('svg-mapa-container');
        const rect = container.getBoundingClientRect();
        tooltip.style.left = `${event.clientX - rect.left + 10}px`;
        tooltip.style.top  = `${event.clientY - rect.top  + 10}px`;
        tooltip.classList.remove('oculto');
    }

    // ── 5. DESCOBRIR NOME DO PAÍS ─────────────────────────────
    function _descobrirNome(element) {
        // Sobe na árvore DOM buscando id/class/name que corresponda a dbPaises
        let el = element;
        while (el && el.tagName?.toLowerCase() !== 'svg') {
            const candidatos = [
                el.getAttribute('id')    || '',
                el.getAttribute('class') || '',
                el.getAttribute('name')  || '',
            ].map(s => s.toUpperCase().split(/[-_\s]/)[0]);

            for (const c of candidatos) {
                // Correspondência exata pelo id do país
                for (const [chave, pais] of Object.entries(dbPaises)) {
                    if (c === pais.id?.toUpperCase() || c === chave.toUpperCase()) {
                        return chave;
                    }
                }
            }
            el = el.parentNode;
        }
        return null;
    }

    // ── 6. NAVEGAÇÃO: ZOOM + ARRASTAR ────────────────────────
    function _iniciarNavegacao() {
        const container = document.getElementById('svg-mapa-container');
        if (!container) return;

        // Zoom com scroll
        container.addEventListener('wheel', (e) => {
            e.preventDefault();
            _zoom += e.deltaY < 0 ? 0.1 : -0.1;
            _zoom  = Math.max(0.5, Math.min(6, _zoom));
            _aplicarTransform();
        }, { passive: false });

        // Arrastar
        container.addEventListener('mousedown',  (e) => { _drag = true; _startX = e.clientX - _posX; _startY = e.clientY - _posY; container.style.cursor = 'grabbing'; });
        container.addEventListener('mousemove',  (e) => { if (!_drag) return; _posX = e.clientX - _startX; _posY = e.clientY - _startY; _aplicarTransform(); });
        container.addEventListener('mouseup',    ()  => { _drag = false; container.style.cursor = 'grab'; });
        container.addEventListener('mouseleave', ()  => { _drag = false; container.style.cursor = 'grab'; });

        // Fechar tooltip ao clicar fora
        container.addEventListener('click', (e) => {
            if (e.target === container || e.target.tagName === 'svg') {
                document.getElementById('map-tooltip')?.classList.add('oculto');
            }
        });
    }

    function _aplicarTransform() {
        const svg = document.querySelector('#svg-mapa-container svg');
        if (svg) svg.style.transform = `translate(${_posX}px, ${_posY}px) scale(${_zoom})`;
    }

    // ── 7. MODO TELA CHEIA ────────────────────────────────────
    function toggleExpandido() {
        document.body.classList.toggle('mapa-focado');
        document.getElementById('btn-fechar-expandido')?.classList.toggle('oculto');
        if (document.body.classList.contains('mapa-focado')) {
            _zoom = 1; _posX = 0; _posY = 0;
            setTimeout(_aplicarTransform, 50);
        }
    }

    // ── 8. AÇÕES DOS BOTÕES DO TOOLTIP ────────────────────────
    function acaoTooltip(tipo) {
        const idSelecionado = GameState.get('mapa.paisSelecionado');
        if (!idSelecionado) return;

        switch (tipo) {
            case 'diplomacia': Diplomacia.enviarEmbaixador(idSelecionado); break;
            case 'sancoes':    Diplomacia.imporSancoes(idSelecionado);     break;
            case 'exercicio':  Militar.exercicioConjunto(idSelecionado);   break;
        }
        document.getElementById('map-tooltip')?.classList.add('oculto');
        _prepararPaises(); // Repinta para refletir mudança
    }

    // ── REAGE A MUDANÇAS DE DIPLOMACIA ────────────────────────
    GameState.on('diplomaciaAtualizada', () => _prepararPaises());

    return {
        carregar,
        mudarFiltro,
        toggleExpandido,
        acaoTooltip,
        getFiltros: () => Object.entries(FILTROS).map(([id, f]) => ({ id, label: f.label })),
    };
})();

window.Mapa = Mapa;
