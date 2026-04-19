// ============================================================
// SOBERANIA | economia.js — Motor Econômico (Escala Mensal)
// Depende de: mundo.js, ui.js (logEvent)
// ============================================================

function calcularTurnoEconomico() {
    // ── RECEITA MENSAL ──────────────────────────────────────
    // PIB * carga tributária / fator_escala / 12 meses
    const revenue = (gameState.gdp * (gameState.taxRate / 100)) / 10 / 12;

    // ── DESPESAS FIXAS MENSAIS ──────────────────────────────
    // Juros da dívida (5% a.a. / 12)
    const interestCost = (gameState.gdp * (gameState.debt / 100)) * 0.05 / 12;
    // Manutenção do aparato estatal (~15B/ano ÷ 12)
    const maintenance = 1.25;

    const netBalance = revenue - interestCost - maintenance;
    gameState.money += netBalance;

    // ── CICLO ECONÔMICO MUNDIAL ─────────────────────────────
    // Oscila suavemente entre 0.88 e 1.12
    gameState.worldCycle = 0.88 + (Math.random() * 0.24);

    // ── CRESCIMENTO MENSAL DO PIB ───────────────────────────
    // Base anual de ~4% (quando estabilidade = 100), dividida por 12
    const baseGrowthAnual  = (gameState.stability / 100) * 0.04;
    const growthMensal     = (baseGrowthAnual * gameState.worldCycle) / 12;
    gameState.gdp *= (1 + growthMensal);

    // ── DÉFICIT → DÍVIDA ────────────────────────────────────
    if (gameState.money < 0) {
        const deficit = Math.abs(gameState.money);
        gameState.debt += (deficit / gameState.gdp) * 100;
        gameState.money = 0;
        logEvent(`DÉFICIT: $${deficit.toFixed(1)}B convertidos em dívida pública.`, 'CRISE');
    }

    // ── DESGASTE NATURAL MENSAL ─────────────────────────────
    // Suave — sem game over (GDD: sandbox puro)
    gameState.stability  = Math.max(5, gameState.stability  - 0.3);
    gameState.popularity = Math.max(5, gameState.popularity - 0.4);
}

// ── SALVAR PONTO NO HISTÓRICO ────────────────────────────────
function salvarHistorico() {
    const label = `${MESES[gameState.month - 1].substring(0, 3)}/${String(gameState.year).slice(2)}`;
    gameState.historyLabels.push(label);
    gameState.historyPIB.push(parseFloat(gameState.gdp.toFixed(1)));
    gameState.historyStability.push(parseFloat(gameState.stability.toFixed(1)));
    gameState.historyDebt.push(parseFloat(gameState.debt.toFixed(2)));

    // Limita histórico a 120 pontos (10 anos) para performance
    const MAX = 120;
    if (gameState.historyLabels.length > MAX) {
        gameState.historyLabels.shift();
        gameState.historyPIB.shift();
        gameState.historyStability.shift();
        gameState.historyDebt.shift();
    }
}
