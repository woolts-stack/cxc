// ============================================================
// POLITYCAL | core/eventos.js
// BANCO DE EVENTOS E DISPARADOR ALEATÓRIO
//
// Para adicionar um novo evento: apenas inclua um objeto no
// array EVENTOS_DB. Zero mudanças em outros arquivos.
// ============================================================

// ── BANCO DE EVENTOS (DATA-DRIVEN) ───────────────────────────
// Cada evento declara seus efeitos como deltas de GameState.
// 'campo' usa a notação de caminho do GameState.set()
const EVENTOS_DB = [
    {
        id: 'boom_commodities', tipo: 'SUCESSO',
        titulo: 'BOOM DE COMMODITIES',
        desc: 'Alta histórica no preço de soja e minério injeta capital no Tesouro.',
        efeitos: [
            { campo: 'economia.tesouro',      delta: +25 },
            { campo: 'politica.estabilidade', delta: +5  },
        ]
    },
    {
        id: 'fuga_capitais', tipo: 'CRISE',
        titulo: 'FUGA DE CAPITAIS',
        desc: 'Incerteza global faz investidores retirarem dólares do país.',
        efeitos: [
            { campo: 'economia.tesouro', delta: -20 },
            { campo: 'economia.inflacao', delta: +2.5 },
        ]
    },
    {
        id: 'descoberta_energetica', tipo: 'SUCESSO',
        titulo: 'DESCOBERTA ENERGÉTICA',
        desc: 'Novas reservas offshore fortalecem a matriz energética nacional.',
        efeitos: [
            { campo: 'economia.tesouro',   delta: +10 },
            { campo: 'politica.poder',     delta: +15 },
        ]
    },
    {
        id: 'crise_fiscal_global', tipo: 'CRISE',
        titulo: 'CRISE FISCAL GLOBAL',
        desc: 'Recessão nos mercados centrais comprime exportações.',
        efeitos: [
            { campo: 'economia.tesouro',       delta: -10 },
            { campo: 'politica.estabilidade',  delta: -5  },
        ]
    },
    {
        id: 'ofensiva_diplomatica', tipo: 'SUCESSO',
        titulo: 'CÚPULA REGIONAL BEM-SUCEDIDA',
        desc: 'Liderança na cúpula eleva o prestígio geopolítico do país.',
        efeitos: [
            { campo: 'politica.poder',       delta: +50 },
            { campo: 'politica.popularidade', delta: +8 },
        ]
    },
    {
        id: 'pressao_diplomatica', tipo: 'CRISE',
        titulo: 'PRESSÃO GEOPOLÍTICA',
        desc: 'Potência exige revisão de acordos sob ameaça de tarifas.',
        efeitos: [
            { campo: 'politica.estabilidade', delta: -8 },
            { campo: 'politica.popularidade', delta: -5 },
        ]
    },
    {
        id: 'acordo_climatico', tipo: 'SUCESSO',
        titulo: 'CRÉDITOS CLIMÁTICOS',
        desc: 'Acordo ambiental internacional abre linha de crédito verde.',
        efeitos: [
            { campo: 'economia.tesouro',      delta: +15 },
            { campo: 'politica.popularidade', delta: +6  },
            { campo: 'politica.estabilidade', delta: +3  },
        ]
    },
    {
        id: 'tensao_pacifico', tipo: 'CRISE',
        titulo: 'TENSÃO NO PACÍFICO',
        desc: 'Conflito regional afeta cadeias de suprimento globais.',
        efeitos: [
            { campo: 'politica.estabilidade', delta: -6 },
            { campo: 'economia.inflacao',     delta: +1.5 },
        ]
    },
    {
        id: 'pandemia_regional', tipo: 'CRISE',
        titulo: 'SURTO EPIDEMIOLÓGICO REGIONAL',
        desc: 'Crise sanitária pressiona saúde pública e produtividade.',
        efeitos: [
            { campo: 'economia.tesouro',      delta: -15 },
            { campo: 'politica.estabilidade', delta: -12 },
            { campo: 'politica.popularidade', delta: -10 },
        ]
    },
    {
        id: 'reformas_aprovadas', tipo: 'SUCESSO',
        titulo: 'REFORMAS ESTRUTURAIS APROVADAS',
        desc: 'Pacote de reformas aprovado eleva confiança dos investidores.',
        efeitos: [
            { campo: 'politica.estabilidade', delta: +10 },
            { campo: 'politica.popularidade', delta: +5  },
            { campo: 'economia.inflacao',     delta: -0.5 },
        ]
    },
];

const Eventos = (() => {

    // Dispara um evento aleatório (~25% de chance por mês)
    function dispararAleatorio() {
        if (Math.random() > 0.25) return;

        const e = EVENTOS_DB[Math.floor(Math.random() * EVENTOS_DB.length)];

        // Aplica efeitos ao GameState via deltas
        e.efeitos.forEach(({ campo, delta }) => {
            const valorAtual = GameState.get(campo) ?? 0;
            // Limita campos 0-100 (estabilidade, popularidade) automaticamente
            const ehPorcentagem = campo.includes('estabilidade') ||
                                   campo.includes('popularidade') ||
                                   campo.includes('prontidao')   ||
                                   campo.includes('tecnologia');
            const novoValor = ehPorcentagem
                ? Math.max(5, Math.min(100, valorAtual + delta))
                : valorAtual + delta;
            GameState.set(campo, novoValor);
        });

        GameState.addLog(`${e.titulo}: ${e.desc}`, e.tipo);
        GameState.emit('eventoDisparado', e);
    }

    // Dispara evento específico por ID (para testes ou scripting)
    function dispararPorId(id) {
        const e = EVENTOS_DB.find(ev => ev.id === id);
        if (e) {
            e.efeitos.forEach(({ campo, delta }) => {
                GameState.set(campo, (GameState.get(campo) ?? 0) + delta);
            });
            GameState.addLog(`${e.titulo}: ${e.desc}`, e.tipo);
        }
    }

    return { dispararAleatorio, dispararPorId, EVENTOS_DB };
})();

window.Eventos = Eventos;
