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
