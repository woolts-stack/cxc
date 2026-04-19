// ============================================================
// SOBERANIA | eventos.js — Eventos Geopolíticos e IA de NPCs
// Depende de: mundo.js, ui.js (logEvent)
// ============================================================

const eventosGlobais = [
    // ── ECONÔMICOS ──────────────────────────────────────────
    {
        id: 'boom_commodities', tipo: 'SUCESSO',
        titulo: 'BOOM DE COMMODITIES',
        desc: 'Alta histórica no preço da soja e minério injeta capital no Tesouro.',
        efeito: { money: 25, stability: 5 }
    },
    {
        id: 'fuga_capitais', tipo: 'CRISE',
        titulo: 'FUGA DE CAPITAIS',
        desc: 'Incerteza global faz investidores retirarem dólares do país.',
        efeito: { money: -20, inflation: 2.5 }
    },
    {
        id: 'descoberta_energetica', tipo: 'SUCESSO',
        titulo: 'DESCOBERTA ENERGÉTICA',
        desc: 'Novas reservas offshore fortalecem a matriz energética nacional.',
        efeito: { gdp: 80, money: 10, power: 15 }
    },
    {
        id: 'crise_fiscal_global', tipo: 'CRISE',
        titulo: 'CRISE FISCAL GLOBAL',
        desc: 'Recessão nos mercados centrais comprime exportações.',
        efeito: { gdp: -60, money: -10, stability: -5 }
    },

    // ── DIPLOMÁTICOS ────────────────────────────────────────
    {
        id: 'ofensiva_diplomatica', tipo: 'SUCESSO',
        titulo: 'CÚPULA REGIONAL BEM-SUCEDIDA',
        desc: 'Liderança na cúpula eleva o prestígio geopolítico do país.',
        efeito: { power: 50, pop: 8 }
    },
    {
        id: 'pressao_washington', tipo: 'CRISE',
        titulo: 'PRESSÃO DE WASHINGTON',
        desc: 'EUA exigem revisão de acordos com a China sob ameaça de tarifas.',
        efeito: { china: -15, stability: -8, pop: -5 },
        vizinho: null
    },
    {
        id: 'crise_argentina', tipo: 'CRISE',
        titulo: 'CRISE NA ARGENTINA',
        desc: 'Colapso cambial no vizinho derruba exportações industriais.',
        efeito: { money: -12, stability: -5 },
        vizinhoId: 'arg', vizinhoDelta: -15
    },

    // ── TECNOLÓGICOS / CLIMÁTICOS ────────────────────────────
    {
        id: 'acordo_climatico', tipo: 'SUCESSO',
        titulo: 'CRÉDITOS CLIMÁTICOS',
        desc: 'Acordo ambiental internacional abre linha de crédito verde.',
        efeito: { money: 15, pop: 6, stability: 3 }
    },
    {
        id: 'tensao_pacifico', tipo: 'CRISE',
        titulo: 'TENSÃO NO PACÍFICO',
        desc: 'Conflito regional afeta cadeias de suprimento globais.',
        efeito: { gdp: -40, stability: -6, inflation: 1.5 }
    },
    {
        id: 'pandemia_regional', tipo: 'CRISE',
        titulo: 'SURTO EPIDEMIOLÓGICO REGIONAL',
        desc: 'Crise sanitária na região pressiona saúde pública e produtividade.',
        efeito: { gdp: -80, money: -15, stability: -12, pop: -10 }
    }
];

// ── DISPARO ALEATÓRIO (~25% de chance por mês) ───────────────
function dispararEventoAleatorio() {
    if (Math.random() > 0.75) return; // Sem evento este mês

    const e = eventosGlobais[Math.floor(Math.random() * eventosGlobais.length)];
    logEvent(`${e.titulo}: ${e.desc}`, e.tipo);

    // Aplica efeitos ao gameState
    const ef = e.efeito;
    if (ef.money)     gameState.money      += ef.money;
    if (ef.gdp)       gameState.gdp         = Math.max(100, gameState.gdp + ef.gdp);
    if (ef.stability) gameState.stability   = Math.max(5, Math.min(100, gameState.stability + ef.stability));
    if (ef.pop)       gameState.popularity  = Math.max(5, Math.min(100, gameState.popularity + ef.pop));
    if (ef.power)     gameState.power      += ef.power;
    if (ef.china)     gameState.chinaRelation += ef.china;
    if (ef.inflation) gameState.inflation  += ef.inflation;

    // Impacto em vizinho específico
    if (e.vizinhoId) {
        const viz = neighbors.find(n => n.id === e.vizinhoId);
        if (viz) viz.relation = Math.max(0, viz.relation + (e.vizinhoDelta || 0));
    }
}

// ── IA DE NPCS: REAÇÃO SIMPLES DOS VIZINHOS ─────────────────
// Chame periodicamente (ex: a cada 6 turnos) para simular mundo vivo
function processarIAVizinhos() {
    neighbors.forEach(n => {
        // Países com relação baixa ficam mais hostis ao longo do tempo
        if (n.relation < 30 && Math.random() > 0.7) {
            n.status = 'Hostil';
            gameState.power -= 2;
            logEvent(`${n.name} adota postura hostil. Poder regional recuou.`, 'CRISE');
        }
        // Países prósperos com boa relação podem propor acordos
        if (n.relation > 80 && n.status === 'Próspero' && Math.random() > 0.85) {
            gameState.money += 5;
            logEvent(`${n.name} propõe acordo bilateral. Receita extra de $5B.`, 'SUCESSO');
        }
    });
}
