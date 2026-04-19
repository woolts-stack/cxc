// ============================================================
// SOBERANIA | militar.js — Capacidade e Estratégia Militar
// Depende de: mundo.js, ui.js (logEvent)
// ============================================================

// Estado militar separado (será integrado ao mundo.js na v2)
const militarState = {
    efetivo:    360000, // Soldados ativos
    tecnologia:     55, // Nível tecnológico (0-100)
    prontidao:      40, // Prontidão de combate (0-100)
    gastosPIB:     1.5  // % do PIB gasto em Defesa
};

// ── PROCESSAMENTO PASSIVO (chamado a cada turno) ─────────────
function processarMilitar() {
    // Custo mensal de manutenção = (PIB * % de gastos) / 12
    const custoMensal = (gameState.gdp * (militarState.gastosPIB / 100)) / 12;
    gameState.money -= custoMensal;

    // Desgaste de prontidão sem investimento adicional
    militarState.prontidao = Math.max(10, militarState.prontidao - 0.15);

    // Prontidão influencia levemente o poder geopolítico
    gameState.power += (militarState.prontidao - 40) * 0.01;
}

// ── AÇÃO: AUMENTAR ORÇAMENTO DE DEFESA ──────────────────────
function aumentarGastosMilitares(percentualAdicional = 0.5) {
    const custo = gameState.gdp * (percentualAdicional / 100) / 12;
    if (gameState.money < custo) {
        logEvent('Sem recursos para expansão militar.', 'CRISE');
        return;
    }
    militarState.gastosPIB += percentualAdicional;
    militarState.prontidao  = Math.min(100, militarState.prontidao + 5);
    gameState.money -= custo;
    logEvent(`Defesa: orçamento elevado para ${militarState.gastosPIB.toFixed(1)}% do PIB.`, 'INFO');
    updateUI();
}

// ── AÇÃO: EXERCÍCIO MILITAR CONJUNTO ────────────────────────
function exercicioMilitar(vizinhoId) {
    const viz = neighbors.find(n => n.id === vizinhoId);
    if (!viz) return;
    const custo = 3;
    if (gameState.money < custo) {
        logEvent('Recursos insuficientes para exercício militar.', 'CRISE');
        return;
    }
    gameState.money         -= custo;
    militarState.tecnologia  = Math.min(100, militarState.tecnologia + 2);
    militarState.prontidao   = Math.min(100, militarState.prontidao  + 8);
    viz.relation             = Math.min(100, viz.relation + 5);
    logEvent(`Exercício conjunto com ${viz.name}. Prontidão aumentou.`, 'SUCESSO');
    updateUI();
}
