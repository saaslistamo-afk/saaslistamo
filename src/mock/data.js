// Dados fictícios para construção da interface (sem backend ainda).

export const HOJE_MOCK = new Date().toISOString().slice(0, 10);

export const PLANOS = [
  {
    id: "premium",
    nome: "Premium",
    preco: 32,
    tagline: "A casa toda organizada, sem esforço",
    beneficios: [
      "Listas de compras ilimitadas",
      "Modo Mercado em tempo real",
      "Categorias automáticas por corredor",
      "Orçamento do mês com alerta",
      "Itens recorrentes sugeridos",
      "Comparação inteligente de preços entre mercados",
      "Escaneamento de código de barras",
      "Despensa com alerta de validade",
      "Resumo diário da despensa",
      "Alerta de itens esquecidos",
      "Histórico ilimitado + comparativo entre meses",
      "Exportar lista em PDF",
    ],
  },
];

export const CATEGORIAS = {
  hortifruti: { label: "Hortifruti", icon: "Carrot", cor: "forest" },
  laticinios: { label: "Laticínios", icon: "Milk", cor: "amber" },
  carnes: { label: "Açougue", icon: "Beef", cor: "terracotta" },
  padaria: { label: "Padaria", icon: "Croissant", cor: "amber" },
  limpeza: { label: "Limpeza", icon: "SprayCan", cor: "forest" },
  higiene: { label: "Higiene", icon: "Sparkles", cor: "terracotta" },
  bebidas: { label: "Bebidas", icon: "CupSoda", cor: "forest" },
  mercearia: { label: "Mercearia", icon: "ShoppingBasket", cor: "amber" },
  congelados: { label: "Congelados", icon: "Snowflake", cor: "forest" },
};

export const LISTA_ATIVA = {
  id: "lista-jun-2026",
  nome: "Compras de Junho",
  mes: "Junho 2026",
  orcamentoDefinido: 850,
  criadaEm: "2026-06-03",
  itens: [
    { id: 1, nome: "Arroz tipo 1 5kg", quantidade: 1, preco: 32.9, categoria: "mercearia", status: "pendente", recorrente: true },
    { id: 2, nome: "Feijão carioca 1kg", quantidade: 2, preco: 8.5, categoria: "mercearia", status: "pendente", recorrente: true },
    { id: 3, nome: "Leite integral 1L", quantidade: 6, preco: 5.4, categoria: "laticinios", status: "carrinho", recorrente: true },
    { id: 4, nome: "Iogurte natural", quantidade: 4, preco: 6.2, categoria: "laticinios", status: "pendente", recorrente: false },
    { id: 5, nome: "Peito de frango", quantidade: 2, preco: 18.9, categoria: "carnes", status: "pendente", recorrente: true },
    { id: 6, nome: "Tomate", quantidade: 1.5, preco: 7.8, categoria: "hortifruti", status: "carrinho", recorrente: false },
    { id: 7, nome: "Banana prata", quantidade: 2, preco: 4.5, categoria: "hortifruti", status: "pendente", recorrente: true },
    { id: 8, nome: "Pão de forma integral", quantidade: 1, preco: 9.9, categoria: "padaria", status: "pendente", recorrente: false },
    { id: 9, nome: "Detergente neutro", quantidade: 3, preco: 2.49, categoria: "limpeza", status: "carrinho", recorrente: true },
    { id: 10, nome: "Sabão em pó 1.6kg", quantidade: 1, preco: 24.9, categoria: "limpeza", status: "pendente", recorrente: false },
    { id: 11, nome: "Papel higiênico 12un", quantidade: 1, preco: 22.5, categoria: "higiene", status: "pendente", recorrente: true },
    { id: 12, nome: "Shampoo", quantidade: 1, preco: 18.0, categoria: "higiene", status: "pendente", recorrente: false },
    { id: 13, nome: "Suco de laranja 1L", quantidade: 2, preco: 9.5, categoria: "bebidas", status: "carrinho", recorrente: false },
    { id: 14, nome: "Café 500g", quantidade: 1, preco: 16.9, categoria: "mercearia", status: "pendente", recorrente: true },
    { id: 15, nome: "Pizza congelada", quantidade: 2, preco: 14.9, categoria: "congelados", status: "pendente", recorrente: false },
  ],
};

export const DESPENSA = [
  { id: 1, nomeProduto: "Manteiga", quantidade: 1, dataValidade: "2026-06-29", categoria: "laticinios" },
  { id: 2, nomeProduto: "Iogurte natural", quantidade: 3, dataValidade: "2026-06-28", categoria: "laticinios" },
  { id: 3, nomeProduto: "Leite integral", quantidade: 4, dataValidade: "2026-07-01", categoria: "laticinios" },
  { id: 4, nomeProduto: "Tomate", quantidade: 6, dataValidade: "2026-07-02", categoria: "hortifruti" },
  { id: 5, nomeProduto: "Pão de forma", quantidade: 1, dataValidade: "2026-07-03", categoria: "padaria" },
  { id: 6, nomeProduto: "Queijo mussarela", quantidade: 1, dataValidade: "2026-07-15", categoria: "laticinios" },
  { id: 7, nomeProduto: "Arroz tipo 1", quantidade: 1, dataValidade: "2026-12-01", categoria: "mercearia" },
  { id: 8, nomeProduto: "Frango congelado", quantidade: 2, dataValidade: "2026-09-10", categoria: "congelados" },
  { id: 9, nomeProduto: "Feijão carioca", quantidade: 2, dataValidade: "2026-11-20", categoria: "mercearia" },
];

export const MERCADOS_CONHECIDOS = ["Pão de Açúcar", "Assaí", "Carrefour"];

// histórico de preços já pagos por produto em cada mercado — alimenta a
// comparação de preços; cresce de verdade conforme o usuário finaliza compras
export const HISTORICO_PRECOS = [
  { produto: "Arroz tipo 1 5kg", preco: 32.9, mercado: "Pão de Açúcar", data: "2026-06-20" },
  { produto: "Arroz tipo 1 5kg", preco: 28.5, mercado: "Assaí", data: "2026-06-05" },
  { produto: "Arroz tipo 1 5kg", preco: 30.9, mercado: "Carrefour", data: "2026-05-15" },

  { produto: "Leite integral 1L", preco: 5.4, mercado: "Pão de Açúcar", data: "2026-06-25" },
  { produto: "Leite integral 1L", preco: 4.8, mercado: "Assaí", data: "2026-06-18" },
  { produto: "Leite integral 1L", preco: 5.1, mercado: "Carrefour", data: "2026-06-02" },

  { produto: "Café 500g", preco: 16.9, mercado: "Pão de Açúcar", data: "2026-06-22" },
  { produto: "Café 500g", preco: 14.5, mercado: "Carrefour", data: "2026-06-10" },

  { produto: "Papel higiênico 12un", preco: 22.5, mercado: "Pão de Açúcar", data: "2026-06-12" },
  { produto: "Papel higiênico 12un", preco: 19.9, mercado: "Assaí", data: "2026-06-27" },

  { produto: "Feijão carioca 1kg", preco: 8.5, mercado: "Pão de Açúcar", data: "2026-06-19" },
  { produto: "Feijão carioca 1kg", preco: 7.2, mercado: "Assaí", data: "2026-06-09" },
  { produto: "Feijão carioca 1kg", preco: 7.9, mercado: "Carrefour", data: "2026-05-28" },

  { produto: "Detergente neutro", preco: 2.49, mercado: "Assaí", data: "2026-06-08" },
  { produto: "Açúcar cristal 1kg", preco: 6.4, mercado: "Assaí", data: "2026-06-14" },

  // comprados com regularidade no passado, mas sem nenhuma compra recente —
  // alimentam o algoritmo real de "itens esquecidos" (ver utils/precos.js)
  { produto: "Papel toalha", preco: 8.9, mercado: "Pão de Açúcar", data: "2026-04-02" },
  { produto: "Papel toalha", preco: 9.2, mercado: "Assaí", data: "2026-05-03" },

  { produto: "Manteiga", preco: 7.8, mercado: "Pão de Açúcar", data: "2026-05-01" },
  { produto: "Manteiga", preco: 8.1, mercado: "Assaí", data: "2026-05-15" },
  { produto: "Manteiga", preco: 7.9, mercado: "Carrefour", data: "2026-05-29" },
];

export function diasParaVencer(dataValidade, hoje = new Date()) {
  const venc = new Date(dataValidade);
  const diff = Math.ceil((venc - hoje) / (1000 * 60 * 60 * 24));
  return diff;
}

export function statusValidade(dataValidade, hoje = new Date()) {
  const dias = diasParaVencer(dataValidade, hoje);
  if (dias < 0) return "vencido";
  if (dias <= 3) return "vencendo";
  return "valido";
}

export function diasAtras(data, hoje = new Date()) {
  return Math.max(0, Math.round((hoje - new Date(data)) / (1000 * 60 * 60 * 24)));
}
