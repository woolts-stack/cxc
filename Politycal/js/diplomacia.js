// ============================================================
// SOBERANIA | diplomacia.js — Relações Bilaterais e Alianças
// Depende de: mundo.js, ui.js (logEvent)
// ============================================================

// ── PROCESSAMENTO PASSIVO (chamado a cada turno) ─────────────
function processarDiplomacia() {
    neighbors.forEach(n => {
        // Deriva diplomática natural: ±1 por turno (vida real dos países)
        const drift = (Math.random() - 0.5) * 1.5;
        n.relation = Math.max(0, Math.min(100, n.relation + drift));
    });
}

// ── AÇÃO ATIVA: ENVIAR MISSÃO DIPLOMÁTICA ───────────────────
function enviarEmbaixador(vizinhoId, bonus = 10, custo = 2) {
    const viz = neighbors.find(n => n.id === vizinhoId);
    if (!viz) return;

    if (gameState.money < custo) {
        logEvent('Recursos insuficientes para missão diplomática.', 'CRISE');
        return;
    }
    gameState.money -= custo;
    viz.relation = Math.min(100, viz.relation + bonus);
    logEvent(`Missão enviada à ${viz.name}. Relação: ${Math.floor(viz.relation)} pts.`, 'SUCESSO');
    updateUI();
}

// ── AÇÃO ATIVA: IMPOR SANÇÕES ECONÔMICAS ────────────────────
function imporSancoes(vizinhoId, penalidade = 20) {
    const viz = neighbors.find(n => n.id === vizinhoId);
    if (!viz) return;
    viz.relation = Math.max(0, viz.relation - penalidade);
    viz.status   = 'Sob Sanções';
    logEvent(`Sanções impostas à ${viz.name}. Relação despencou.`, 'CRISE');
    updateUI();
}

// ── CALCULAR PODER REGIONAL ──────────────────────────────────
function calcularPoderRegional() {
    const mediaRelacoes = neighbors.reduce((sum, n) => sum + n.relation, 0) / neighbors.length;
    // Power sobe lentamente com relações positivas
    const bonusDiplomatico = (mediaRelacoes - 50) * 0.5;
    gameState.power += bonusDiplomatico / 12; // Dividido por 12 (mensal)
    gameState.power  = Math.max(0, gameState.power);
}
