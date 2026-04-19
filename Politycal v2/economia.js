// ============================================================
// POLITYCAL | core/economia.js
// SUBSISTEMA ECONÔMICO — Escala mensal.
// Depende apenas de: GameState, vizinhos via dbPaises
// ============================================================

const Economia = (() => {

    function processar() {
        const eco  = GameState.section('economia');
        const pol  = GameState.section('politica');

        // ── RECEITA MENSAL ──────────────────────────────────
        // PIB * alíquota / fator_escala / 12 meses
        const receita = (eco.pib * (eco.impostoPct / 100)) / 10 / 12;

        // ── DESPESAS FIXAS ──────────────────────────────────
        const jurosDivida = (eco.pib * (eco.dividaPib / 100)) * 0.05 / 12;
        const manutencao  = 1.25; // ~$15B/ano ÷ 12

        const saldo = receita - jurosDivida - manutencao;
        let novoTesouro = eco.tesouro + saldo;

        // ── CICLO ECONÔMICO MUNDIAL ─────────────────────────
        const cicleMundial = 0.88 + (Math.random() * 0.24);

        // ── CRESCIMENTO DO PIB ──────────────────────────────
        const crescBase  = (pol.estabilidade / 100) * 0.04;
        const crescMensal = (crescBase * cicleMundial) / 12;
        const novoPib = eco.pib * (1 + crescMensal);

        // ── DÉFICIT → DÍVIDA ────────────────────────────────
        let novaDivida = eco.dividaPib;
        if (novoTesouro < 0) {
            const deficit = Math.abs(novoTesouro);
            novaDivida += (deficit / novoPib) * 100;
            novoTesouro = 0;
            GameState.addLog(`DÉFICIT: $${deficit.toFixed(1)}B convertidos em dívida pública.`, 'CRISE');
        }

        // ── INFLAÇÃO (deriva lenta) ─────────────────────────
        const novaInflacao = Math.max(1, Math.min(30,
            eco.inflacao + (Math.random() - 0.5) * 0.3
        ));

        // ── DESGASTE NATURAL ────────────────────────────────
        const novaEstabilidade  = Math.max(5, pol.estabilidade  - 0.3);
        const novaPopularidade  = Math.max(5, pol.popularidade  - 0.4);

        // ── GRAVA TUDO DE UMA VEZ ────────────────────────────
        GameState.patch('economia', {
            pib:        novoPib,
            crescimento: crescMensal * 100 * 12, // % anualizado
            tesouro:    novoTesouro,
            dividaPib:  Math.min(200, novaDivida),
            inflacao:   novaInflacao,
        });

        GameState.patch('politica', {
            estabilidade: novaEstabilidade,
            popularidade: novaPopularidade,
        });
    }

    // ── AÇÃO: AJUSTAR IMPOSTOS ───────────────────────────────
    // Chamada pelo painel de economia na UI
    function ajustarImpostos(novaPct) {
        const pct = Math.max(5, Math.min(50, novaPct));
        GameState.set('economia.impostoPct', pct);

        // Imposto alto desacelera PIB, imposto baixo reduz receita
        const efeitoEstabilidade = pct > 35 ? -5 : pct < 15 ? -3 : 2;
        const estAtual = GameState.get('politica.estabilidade');
        GameState.set('politica.estabilidade', Math.max(5, Math.min(100, estAtual + efeitoEstabilidade)));

        GameState.addLog(`Carga tributária ajustada para ${pct}% do PIB.`, 'INFO');
    }

    return { processar, ajustarImpostos };
})();

window.Economia = Economia;
