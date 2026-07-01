const PALAVRAS_CHAVE = {
  hortifruti: ["tomate", "banana", "alface", "cebola", "batata", "fruta", "verdura", "legume", "maca", "laranja", "limao", "cenoura"],
  laticinios: ["leite", "queijo", "iogurte", "manteiga", "requeijao", "margarina"],
  carnes: ["frango", "carne", "peixe", "linguica", "bacon", "peito", "bisteca", "costela", "presunto"],
  padaria: ["pao", "bolo", "biscoito", "croissant", "torrada"],
  limpeza: ["detergente", "sabao em po", "desinfetante", "amaciante", "agua sanitaria", "esponja", "vassoura", "papel toalha"],
  higiene: ["papel higienico", "shampoo", "sabonete", "pasta de dente", "absorvente", "desodorante", "creme dental"],
  bebidas: ["suco", "refrigerante", "agua mineral", "cerveja", "vinho", "energetico"],
  congelados: ["congelado", "pizza", "sorvete", "nuggets", "lasanha"],
  mercearia: ["arroz", "feijao", "acucar", "sal", "oleo", "macarrao", "cafe", "farinha", "achocolatado"],
};

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, ""); // remove acentos
}

// remove um "s" final simples (banana/bananas, tomate/tomates) sem mexer em
// palavras curtas, só pra casar plural/singular sem virar substring solto
function singular(palavra) {
  return palavra.length > 3 && palavra.endsWith("s") ? palavra.slice(0, -1) : palavra;
}

// quantidade base por pessoa por compra, por categoria — calibrada pra uma
// compra semanal/quinzenal típica; ajustada conforme o número de moradores
const CONSUMO_PER_PESSOA = {
  laticinios: 1.5,
  carnes: 0.5,
  hortifruti: 1.5,
  padaria: 0.5,
  limpeza: 0.2,
  higiene: 0.3,
  bebidas: 0.5,
  mercearia: 0.5,
  congelados: 0.3,
};

export function quantidadeSugerida(nomeProduto, numeroPessoas) {
  if (!numeroPessoas || numeroPessoas <= 0) return 1;
  const categoria = inferirCategoria(nomeProduto);
  const fator = CONSUMO_PER_PESSOA[categoria] ?? 0.5;
  return Math.max(1, Math.round(numeroPessoas * fator));
}

// palavras que sinalizam conflito com cada restrição alimentar
const PALAVRAS_RESTRICAO = {
  "Sem lactose": ["leite", "queijo", "iogurte", "manteiga", "requeijao", "margarina", "creme de leite", "leite condensado"],
  "Sem glúten":  ["pao", "macarrao", "biscoito", "bolo", "farinha de trigo", "cerveja", "torrada"],
  "Vegetariano": ["frango", "carne", "peixe", "linguica", "bacon", "presunto", "bisteca", "costela"],
  "Vegano":      ["frango", "carne", "peixe", "linguica", "bacon", "presunto", "leite", "queijo", "iogurte", "manteiga", "ovo", "mel"],
  "Diabético":   ["acucar", "refrigerante", "chocolate", "bolo", "sorvete", "doce"],
  "Sem açúcar":  ["acucar", "refrigerante", "chocolate", "sorvete", "doce"],
};

// retorna o nome da primeira restrição que conflita com o produto, ou null
export function restricaoConflitante(nomeProduto, restricoesAtivas) {
  if (!restricoesAtivas?.length) return null;
  const nome = normalizar(nomeProduto);
  for (const restricao of restricoesAtivas) {
    const palavras = PALAVRAS_RESTRICAO[restricao] ?? [];
    if (palavras.some((p) => nome.includes(normalizar(p)))) return restricao;
  }
  return null;
}

export function inferirCategoria(nomeProduto) {
  const nome = normalizar(nomeProduto);
  const palavrasDoNome = nome.split(/\s+/).map(singular);

  for (const [categoria, palavras] of Object.entries(PALAVRAS_CHAVE)) {
    for (const palavraChave of palavras) {
      const chaveNormalizada = normalizar(palavraChave);
      const ehFrase = chaveNormalizada.includes(" ");
      // frases (ex.: "papel higienico") usam substring; palavras únicas exigem
      // bater com uma palavra inteira do nome (já no singular), evitando
      // falsos positivos como "maca" (de maçã) casando dentro de "macarrão"
      const bate = ehFrase ? nome.includes(chaveNormalizada) : palavrasDoNome.includes(chaveNormalizada);
      if (bate) return categoria;
    }
  }
  return "mercearia";
}
