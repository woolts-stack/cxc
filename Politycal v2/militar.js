// ============================================================
// POLITYCAL | core/militar.js
// SUBSISTEMA MILITAR — Capacidade de defesa e projeção.
// ============================================================

const Militar = (() => {

    function processar() {
        const mil = GameState.section('militar');
        const eco = GameState.section('economia');

        // Custo de manutenção mensal
        const custoMensal = (eco.pib * (mil.gastosPib / 100)) / 12;
        const novoTesouro = Math.max(0, eco.tesouro - custoMensal);
        GameState.set('economia.tesouro', novoTesouro);

        // Desgaste de prontidão
        const novaProntidao = Math.max(10, mil.prontidao - 0.15);
        GameState.set('militar.prontidao', novaProntidao);

        // Prontidão influencia poder geopolítico
        const poderAtual = GameState.get('politica.poder');
        const deltaP = (novaProntidao - 40) * 0.01;
        GameState.set('politica.poder', Math.max(0, poderAtual + deltaP));
    }

    // ── AÇÃO: AUMENTAR GASTOS MILITARES ──────────────────────
    function aumentarGastos(percentualExtra = 0.5) {
        const mil = GameState.section('militar');
        const eco = GameState.section('economia');
        const custo = eco.pib * (percentualExtra / 100) / 12;

        if (eco.tesouro < custo) {
            GameState.addLog('Sem recursos para expansão militar.', 'CRISE');
            return;
        }
        GameState.set('economia.tesouro', eco.tesouro - custo);
        GameState.set('militar.gastosPib', mil.gastosPib + percentualExtra);
        GameState.set('militar.prontidao', Math.min(100, mil.prontidao + 5));
        GameState.addLog(`Defesa: orçamento elevado para ${(mil.gastosPib + percentualExtra).toFixed(1)}% do PIB.`, 'INFO');
        GameState.emit('militarAtualizado');
    }

    // ── AÇÃO: EXERCÍCIO CONJUNTO ──────────────────────────────
    function exercicioConjunto(idPais) {
        const viz = dbPaises[idPais];
        if (!viz) return;
        const custo = 3;
        const eco = GameState.section('economia');
        const mil = GameState.section('militar');

        if (eco.tesouro < custo) {
            GameState.addLog('Recursos insuficientes para exercício militar.', 'CRISE');
            return;
        }
        GameState.set('economia.tesouro', eco.tesouro - custo);
        GameState.set('militar.tecnologia', Math.min(100, mil.tecnologia + 2));
        GameState.set('militar.prontidao',  Math.min(100, mil.prontidao  + 8));
        viz.diplomacia.relacao = Math.min(100, (viz.diplomacia.relacao || 50) + 5);
        GameState.addLog(`Exercício conjunto com ${viz.nome}. Prontidão aumentou.`, 'SUCESSO');
        GameState.emit('militarAtualizado');
    }

    return { processar, aumentarGastos, exercicioConjunto };
})();

window.Militar = Militar;
