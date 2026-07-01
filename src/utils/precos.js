import { normalizar, inferirCategoria } from "./categorizar";

// procura o produto digitado no histórico (casa por substring nos dois
// sentidos, então "arroz" encontra "Arroz tipo 1 5kg" e vice-versa)
export function buscarHistoricoProduto(nomeProduto, historicoPrecos) {
  const alvo = normalizar(nomeProduto.trim());
  if (!alvo) return [];
  return historicoPrecos.filter((h) => {
    const registrado = normalizar(h.produto);
    return registrado.includes(alvo) || alvo.includes(registrado);
  });
}

// para cada mercado, mantém só o registro de preço mais recente daquele produto
export function ultimoPrecoPorMercado(nomeProduto, historicoPrecos) {
  const encontrados = buscarHistoricoProduto(nomeProduto, historicoPrecos);
  const porMercado = new Map();
  for (const registro of encontrados) {
    const atual = porMercado.get(registro.mercado);
    if (!atual || new Date(registro.data) > new Date(atual.data)) porMercado.set(registro.mercado, registro);
  }
  return [...porMercado.values()].sort((a, b) => a.preco - b.preco);
}

// agrupa todo o histórico por produto, já com o melhor preço por mercado —
// usado na aba Comparar Preços
export function agruparHistoricoPorProduto(historicoPrecos) {
  const grupos = new Map();
  for (const registro of historicoPrecos) {
    const chave = normalizar(registro.produto);
    if (!grupos.has(chave)) grupos.set(chave, { produto: registro.produto, registros: [] });
    grupos.get(chave).registros.push(registro);
  }
  return [...grupos.values()]
    .map((grupo) => ({
      produto: grupo.produto,
      porMercado: ultimoPrecoPorMercado(grupo.produto, grupo.registros),
    }))
    .sort((a, b) => a.produto.localeCompare(b.produto));
}

// soma, por mercado, o melhor (menor) preço de cada produto distinto —
// dá uma ideia de qual mercado costuma sair mais em conta no geral
export function resumoPorMercado(historicoPrecos) {
  const grupos = agruparHistoricoPorProduto(historicoPrecos);
  const totais = new Map();
  for (const grupo of grupos) {
    const maisBarato = grupo.porMercado[0];
    if (!maisBarato) continue;
    totais.set(maisBarato.mercado, (totais.get(maisBarato.mercado) || 0) + 1);
  }
  return [...totais.entries()]
    .map(([mercado, vezesMaisBarato]) => ({ mercado, vezesMaisBarato }))
    .sort((a, b) => b.vezesMaisBarato - a.vezesMaisBarato);
}

const MINIMO_RECORRENTE = 2;

// quantas vezes esse produto já foi comprado (qualquer mercado), pelo histórico real
export function frequenciaCompra(nomeProduto, historicoPrecos) {
  const chave = normalizar(nomeProduto.trim());
  return historicoPrecos.filter((r) => normalizar(r.produto) === chave).length;
}

// true se o produto já foi comprado vezes suficientes pra contar como "recorrente"
export function ehRecorrente(nomeProduto, historicoPrecos, minimo = MINIMO_RECORRENTE) {
  return frequenciaCompra(nomeProduto, historicoPrecos) >= minimo;
}

// produtos comprados com frequência que ainda não estão na lista atual —
// alimenta a sugestão "Você sempre compra" com dados reais, não mais fixos
export function produtosRecorrentes(historicoPrecos, itensAtuais, { minimo = MINIMO_RECORRENTE, limite = 5 } = {}) {
  const contagem = new Map();
  for (const registro of historicoPrecos) {
    const chave = normalizar(registro.produto);
    if (!contagem.has(chave)) contagem.set(chave, { produto: registro.produto, vezes: 0 });
    contagem.get(chave).vezes += 1;
  }

  const naLista = new Set(itensAtuais.map((i) => normalizar(i.nome)));

  return [...contagem.values()]
    .filter((p) => p.vezes >= minimo && !naLista.has(normalizar(p.produto)))
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, limite);
}

// gasto real por categoria no mês indicado pelo prefixo (ex.: "2026-06") —
// derivado do historicoPrecos, nunca de um array estático
export function gastoPorCategoria(historicoPrecos, prefixoMes) {
  const totais = new Map();
  for (const r of historicoPrecos) {
    if (!r.data.startsWith(prefixoMes)) continue;
    const cat = inferirCategoria(r.produto);
    totais.set(cat, (totais.get(cat) || 0) + r.preco * (r.quantidade ?? 1));
  }
  return [...totais.entries()]
    .map(([categoria, valor]) => ({ categoria, valor: parseFloat(valor.toFixed(2)) }))
    .sort((a, b) => b.valor - a.valor);
}

// produtos comprados regularmente no passado mas sem compra recente —
// detecta padrão de esquecimento real comparando o intervalo médio entre
// compras com o tempo desde a última compra
export function itensEsquecidos(historicoPrecos, hoje, { minimo = MINIMO_RECORRENTE, fator = 1.4 } = {}) {
  const porProduto = new Map();
  for (const r of historicoPrecos) {
    const chave = normalizar(r.produto);
    if (!porProduto.has(chave)) porProduto.set(chave, { produto: r.produto, datas: [] });
    porProduto.get(chave).datas.push(r.data);
  }

  const resultado = [];
  const hojeMs = new Date(hoje).getTime();
  for (const { produto, datas } of porProduto.values()) {
    if (datas.length < minimo) continue;
    const ordenadas = [...datas].sort();
    const intervalos = [];
    for (let i = 1; i < ordenadas.length; i++) {
      intervalos.push((new Date(ordenadas[i]) - new Date(ordenadas[i - 1])) / 86400000);
    }
    const intervaloMedio = intervalos.reduce((s, v) => s + v, 0) / intervalos.length;
    const diasDesdeUltima = (hojeMs - new Date(ordenadas[ordenadas.length - 1]).getTime()) / 86400000;
    if (intervaloMedio > 0 && diasDesdeUltima > intervaloMedio * fator) {
      resultado.push({
        nome: produto,
        diasSemComprar: Math.round(diasDesdeUltima),
        intervaloMedio: Math.round(intervaloMedio),
      });
    }
  }
  return resultado;
}
