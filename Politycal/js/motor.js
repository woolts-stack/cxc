// js/motor.js

// 1. ESTADO GLOBAL DO TEMPO
const engineJogo = {
    mesAtual: 0, // Janeiro = 0, Fevereiro = 1...
    anoAtual: 2026,
    nomesMeses: ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"],
    
    // Configurações de cálculo
    diasNoMes: 30 
};

// 2. FUNÇÃO DE PASSAGEM DE TURNO
function processarPassagemTurno() {
    // Aumenta o mês
    engineJogo.mesAtual++;

    // Se passar de Dezembro (11), volta para Janeiro e aumenta o ano
    if (engineJogo.mesAtual > 11) {
        engineJogo.mesAtual = 0;
        engineJogo.anoAtual++;
    }

    // AQUI ENTRARÁ A LÓGICA ECONÔMICA (Exemplo simples)
    const pais = dbPaises[estadoJogo.paisJogador];
    
    // Cálculo de crescimento mensal: (PIB * %Crescimento) / 12 meses
    const crescimentoMensal = (pais.economia.pib * (pais.economia.crescimento / 100)) / 12;
    pais.economia.pib += crescimentoMensal;

    // Cálculo de Dívida (Juros de 0.5% ao mês, por exemplo)
    const jurosDivida = (pais.economia.pib * (pais.economia.dividaPib / 100)) * 0.005;
    pais.economia.tesouro -= jurosDivida;

    console.log(`Turno processado: ${engineJogo.nomesMeses[engineJogo.mesAtual]} de ${engineJogo.anoAtual}`);
}

/**
 * Lógica de Proporcionalidade que você sugeriu:
 * Se um evento dura 'X' dias, o impacto dele no PIB mensal é:
 * impactoFinal = (valorDoImpacto * (diasDuracao / 30))
 */
function calcularImpactoProporcional(valor, dias) {
    return valor * (dias / engineJogo.diasNoMes);
}