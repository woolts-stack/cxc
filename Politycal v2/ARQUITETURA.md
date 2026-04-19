# POLITYCAL — Guia de Arquitetura

## Estrutura de Pastas

```
politycal/
│
├── index.html              ← Casca estável. Raramente muda.
├── mundo.svg               ← Mapa SVG (não modificar)
│
├── css/
│   └── estilo.css
│
├── data/
│   └── mundo.js            ← Banco de dados IMUTÁVEL.
│                             Nunca escreva nele durante o jogo.
│
├── core/                   ← "Cérebro". Sem DOM, sem querySelector.
│   ├── state.js            ← FONTE ÚNICA DE VERDADE ⭐
│   ├── motor.js            ← Orquestra subsistemas por turno
│   ├── economia.js         ← Lógica econômica
│   ├── diplomacia.js       ← Lógica diplomática
│   ├── militar.js          ← Lógica militar
│   └── eventos.js          ← Eventos aleatórios
│
└── ui/                     ← "Olhos". Só renderiza. Zero cálculo.
    ├── ui.js               ← Renderer geral, sistema de abas
    └── mapa.js             ← Mapa SVG, filtros, tooltip
```

## A Regra de Ouro (Anti-Caos)

```
data/       → Só armazena dados. Nunca calcula.
core/       → Só calcula. Nunca toca o DOM.
ui/         → Só renderiza. Nunca calcula.
```

Se você sentir vontade de chamar `document.getElementById()` dentro de
`core/economia.js`, PARE. Coloque o dado no GameState e deixe `ui/ui.js`
renderizar.

## Como os Módulos se Comunicam

Eles NÃO se chamam diretamente. Eles publicam e escutam eventos:

```javascript
// Em core/economia.js: algo aconteceu
GameState.addLog('PIB cresceu!', 'SUCESSO');
GameState.emit('economiaMudou', { pib: 2500 });

// Em ui/ui.js: reage ao evento
GameState.on('economiaMudou', ({ pib }) => {
    document.getElementById('jogo-pib').textContent = pib;
});
```

Isso significa: você pode adicionar `ui/graficos.js` amanhã que escuta
`economiaMudou` e desenha um gráfico — sem tocar em `economia.js`.

## Como Adicionar Nova Aba (sem quebrar nada)

1. No `index.html`, adicione no aside:
   ```html
   <button class="btn-acao" onclick="UI.abrirAba('tela-religiao', this)">⛪ Religião</button>
   ```

2. No `index.html`, adicione o painel (copie um existente):
   ```html
   <div id="tela-religiao" class="aba-conteudo oculto">
       <h2 class="titulo-aba">⛪ MAPA RELIGIOSO</h2>
   </div>
   ```

3. Crie `ui/religiao.js` se precisar de lógica específica. **Pronto.**

## Como Adicionar Novo Filtro de Mapa

Em `ui/mapa.js`, dentro do objeto `FILTROS`, adicione:
```javascript
religiao: {
    label: 'Religião',
    cor: (dados) => {
        switch(dados?.religiao?.dominante) {
            case 'Cristão': return '#4169E1';
            case 'Islã':    return '#2ECC71';
            default:        return '#5c6e7a';
        }
    },
},
```

Adicione o botão no HTML:
```html
<button onclick="Mapa.mudarFiltro('religiao')" class="btn-filtro">⛪ Religião</button>
```
**Pronto. Zero mudanças em outros arquivos.**

## Como Adicionar Novo Evento

Em `core/eventos.js`, dentro de `EVENTOS_DB`, adicione:
```javascript
{
    id: 'meu_evento', tipo: 'SUCESSO',
    titulo: 'NOME DO EVENTO',
    desc: 'Descrição do que aconteceu.',
    efeitos: [
        { campo: 'economia.tesouro',      delta: +20 },
        { campo: 'politica.estabilidade', delta: +5  },
    ]
},
```
**Pronto. Zero mudanças em outros arquivos.**

## Como Adicionar Nova Mecânica (ex: Comércio)

1. Crie `core/comercio.js`
2. Ele lê o estado com `GameState.get(...)` e escreve com `GameState.set(...)`
3. No `core/motor.js`, adicione `Comercio.processar()` dentro de `avancarTurno()`
4. Adicione `<script src="core/comercio.js">` no HTML **antes** de `core/motor.js`
5. A UI já vai refletir as mudanças automaticamente se você usar `GameState.set()`

## Estrutura do mundo.js (Referência)

O banco de dados deve seguir esta estrutura para que todos os módulos
funcionem corretamente:

```javascript
const dbPaises = {
    "Brasil": {
        id: "br",
        nome: "Brasil",
        vizinhos: ["Argentina", "Peru", ...],  // ← Chaves do próprio dbPaises
        economia: {
            pib:        2200,   // Bilhões de dólares
            crescimento: 2.9,   // % anual
            tesouro:    150,    // B$ disponíveis
            dividaPib:  88,     // % do PIB
            inflacao:   4.5,    // %
            impostos:   33,     // %
        },
        recursos: {
            populacao: 215,   // Milhões
            ouro:      100,   // Toneladas
            uranio:    300,   // Toneladas
            petroleo:  50,    // Milhões de barris/dia
        },
        militar: {
            efetivo:    360000,
            tecnologia: 55,
            prontidao:  40,
            gastosPib:  1.5,
        },
        diplomacia: {
            relacao: 50,     // 0–100 (inimigo → aliado)
            status:  'Neutro',
        },
    },
    // ... outros países
};
```

## Ordem de Carregamento dos Scripts (CRÍTICA)

```html
<script src="data/mundo.js"></script>       <!-- 1. Dados -->
<script src="core/state.js"></script>       <!-- 2. Estado (base de tudo) -->
<script src="core/eventos.js"></script>     <!-- 3. Subsistemas -->
<script src="core/economia.js"></script>
<script src="core/diplomacia.js"></script>
<script src="core/militar.js"></script>
<script src="core/motor.js"></script>       <!-- 4. Motor (depende dos subsistemas) -->
<script src="ui/mapa.js"></script>          <!-- 5. UI -->
<script src="ui/ui.js"></script>            <!-- 6. UI geral (sempre por último) -->
```

Se a ordem mudar, você vai ter erros de "X is not defined".
