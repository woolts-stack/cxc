// ============================================================
// POLITYCAL | core/motor.js
// MOTOR DE TURNOS — Orquestra todos os subsistemas por mês.
//
// REGRA: Este arquivo NÃO toca o DOM. Apenas atualiza GameState
// e emite eventos. A UI reage automaticamente.
// ============================================================

const Motor = (() => {

    // ── AVANÇAR UM MÊS ──────────────────────────────────────
    function avancarTurno() {
        if (!GameState.get('emPartida')) return;

        // 1. Salva snapshot do estado atual no histórico de gráficos
        GameState.salvarHistorico();

        // 2. Processa subsistemas (cada um lê/escreve em GameState)
        Economia.processar();
        Diplomacia.processar();
        Militar.processar();
        Eventos.dispararAleatorio();

        // 3. Avança o tempo
        let mes = GameState.get('mes');
        let ano = GameState.get('ano');
        mes++;
        if (mes > 11) { mes = 0; ano++; }
        const turno = GameState.get('turno') + 1;

        GameState.patch('', {}); // (pequeno hack para evitar set em múltiplos campos)
        GameState.set('mes',   mes);
        GameState.set('ano',   ano);
        GameState.set('turno', turno);

        // 4. Notifica todos os módulos que o turno acabou
        GameState.emit('turnoProcessado', { mes, ano, turno });

        console.log(`[Motor] Turno ${turno}: ${GameState.getDataFormatada()}`);
    }

    return { avancarTurno };
})();

window.Motor = Motor;
