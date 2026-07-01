import { normalizar } from "./categorizar";

// distância de edição entre duas strings — quanto menor, mais parecidas
function distanciaLevenshtein(a, b) {
  const linhas = a.length + 1;
  const colunas = b.length + 1;
  const dp = Array.from({ length: linhas }, () => new Array(colunas).fill(0));
  for (let i = 0; i < linhas; i++) dp[i][0] = i;
  for (let j = 0; j < colunas; j++) dp[0][j] = j;
  for (let i = 1; i < linhas; i++) {
    for (let j = 1; j < colunas; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

// 0 a 1 — quão parecidos são dois nomes de produto, tolerando erro de digitação
export function similaridade(nomeA, nomeB) {
  const a = normalizar(nomeA.trim());
  const b = normalizar(nomeB.trim());
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  const distancia = distanciaLevenshtein(a, b);
  return 1 - distancia / Math.max(a.length, b.length);
}

const LIMIAR_MINIMO = 0.5;

// entre os itens pendentes, acha o que mais se parece com o nome escaneado —
// usado pra casar o produto mesmo quando o nome não é idêntico ao digitado na lista
export function encontrarMelhorCorrespondencia(nomeEscaneado, itens, limiar = LIMIAR_MINIMO) {
  let melhorItem = null;
  let melhorScore = 0;
  for (const item of itens) {
    const score = similaridade(nomeEscaneado, item.nome);
    if (score > melhorScore) {
      melhorScore = score;
      melhorItem = item;
    }
  }
  return melhorScore >= limiar ? { item: melhorItem, score: melhorScore } : null;
}
