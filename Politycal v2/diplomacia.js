// ============================================================
// POLITYCAL | core/diplomacia.js
// SUBSISTEMA DIPLOMÁTICO — Relações bilaterais e alianças.
//
// Como acessar vizinhos: dbPaises tem todos os países.
// 'neighbors' é uma lista derivada dinamicamente dos vizinhos
// do país jogador (ver função _getVizinhos abaixo).
// ============================================================

const Diplomacia = (() => {

    // Cache dos vizinhos para não recalcular todo turno
    let _vizinhosCache = null;

    // Busca os vizinhos do país atual (baseado nos dados de dbPaises)
    function _getVizinhos() {
        if (_vizinhosCache) return _vizinhosCache;
        const chavePais = GameState.get('paisJogador');
        const pais      = dbPaises[chavePais];
        if (!pais?.vizinhos) return [];
        _vizinhosCache = pais.vizinhos.map(id => dbPaises[id]).filter(Boolean);
        return _vizinhosCache;
    }

    // Limpa cache quando jogo reinicia
    GameState.on('jogoIniciado', () => { _vizinhosCache = null; });

    // ── PROCESSAMENTO PASSIVO ─────────────────────────────────
    function processar() {
        const vizinhos = _getVizinhos();
        vizinhos.forEach(v => {
            // Deriva diplomática natural: ±0.75 por mês
            const drift = (Math.random() - 0.5) * 1.5;
            v.diplomacia.relacao = Math.max(0, Math.min(100, (v.diplomacia.relacao || 50) + drift));

            // IA simples: países hostis ficam mais hostis
            if (v.diplomacia.relacao < 30 && Math.random() > 0.7) {
                v.diplomacia.status = 'Hostil';
                const poderAtual = GameState.get('politica.poder');
                GameState.set('politica.poder', Math.max(0, poderAtual - 2));
                GameState.addLog(`${v.nome} adota postura hostil. Poder regional recuou.`, 'CRISE');
            }

            // Aliados prosperos podem propor acordos
            if (v.diplomacia.relacao > 80 && v.diplomacia.status === 'Próspero' && Math.random() > 0.85) {
                const tesAtual = GameState.get('economia.tesouro');
                GameState.set('economia.tesouro', tesAtual + 5);
                GameState.addLog(`${v.nome} propõe acordo bilateral. Receita extra de $5B.`, 'SUCESSO');
            }
        });

        // Poder regional sobe/desce com a média das relações
        const vizinhos2 = _getVizinhos();
        if (vizinhos2.length > 0) {
            const media = vizinhos2.reduce((s, v) => s + (v.diplomacia.relacao || 50), 0) / vizinhos2.length;
            const delta = ((media - 50) * 0.5) / 12;
            const poderAtual = GameState.get('politica.poder');
            GameState.set('politica.poder', Math.max(0, poderAtual + delta));
        }
    }

    // ── AÇÃO: ENVIAR EMBAIXADOR ───────────────────────────────
    function enviarEmbaixador(idVizinho, bonus = 10, custo = 2) {
        const viz = dbPaises[idVizinho];
        if (!viz) return;

        const tesouro = GameState.get('economia.tesouro');
        if (tesouro < custo) {
            GameState.addLog('Recursos insuficientes para missão diplomática.', 'CRISE');
            return;
        }
        GameState.set('economia.tesouro', tesouro - custo);
        viz.diplomacia.relacao = Math.min(100, (viz.diplomacia.relacao || 50) + bonus);
        GameState.addLog(`Missão enviada à ${viz.nome}. Relação: ${Math.floor(viz.diplomacia.relacao)} pts.`, 'SUCESSO');
        GameState.emit('diplomaciaAtualizada', { idVizinho });
    }

    // ── AÇÃO: IMPOR SANÇÕES ───────────────────────────────────
    function imporSancoes(idVizinho, penalidade = 20) {
        const viz = dbPaises[idVizinho];
        if (!viz) return;
        viz.diplomacia.relacao = Math.max(0, (viz.diplomacia.relacao || 50) - penalidade);
        viz.diplomacia.status  = 'Sob Sanções';
        GameState.addLog(`Sanções impostas à ${viz.nome}. Relação despencou.`, 'CRISE');
        GameState.emit('diplomaciaAtualizada', { idVizinho });
    }

    // ── LEITURA PÚBLICA ───────────────────────────────────────
    function getRelacao(idPais) {
        return dbPaises[idPais]?.diplomacia?.relacao ?? 50;
    }

    return { processar, enviarEmbaixador, imporSancoes, getRelacao };
})();

window.Diplomacia = Diplomacia;
