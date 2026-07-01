import { useState } from "react";
import { Plus, Trash2, UserRound, Check } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import { useApp } from "../context/AppContext";

const RESTRICOES_DISPONIVEIS = ["Sem lactose", "Sem glúten", "Vegetariano", "Vegano", "Diabético", "Sem açúcar"];

const FAIXAS_DISPONIVEIS = ["Bebê (0-2 anos)", "Criança (3-12 anos)", "Adolescente", "Adulto", "Idoso"];

// garante compatibilidade com o formato antigo (string simples em vez de objeto)
function normalizarMorador(item) {
  return typeof item === "string" ? { nome: "", faixa: item } : item;
}

export default function HouseholdProfile() {
  const { isPremium, faixasIdade, setFaixasIdade, restricoesAlimentares, setRestricoesAlimentares } = useApp();

  const [moradores, setMoradores] = useState(() => faixasIdade.map(normalizarMorador));
  const [restricoes, setRestricoes] = useState(restricoesAlimentares);
  const [salvo, setSalvo] = useState(false);

  function adicionarPessoa() {
    setMoradores((prev) => [...prev, { nome: "", faixa: "Adulto" }]);
  }
  function removerPessoa(idx) {
    setMoradores((prev) => prev.filter((_, i) => i !== idx));
  }
  function atualizarNome(idx, valor) {
    setMoradores((prev) => prev.map((m, i) => (i === idx ? { ...m, nome: valor } : m)));
  }
  function atualizarFaixa(idx, valor) {
    setMoradores((prev) => prev.map((m, i) => (i === idx ? { ...m, faixa: valor } : m)));
  }
  function alternarRestricao(r) {
    setRestricoes((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  function salvar() {
    setFaixasIdade(moradores);
    setRestricoesAlimentares(restricoes);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }

  if (!isPremium) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center pt-20 text-center">
        <UserRound className="h-10 w-10 text-ink-300" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900">Perfil da casa é exclusivo do Premium</h1>
        <p className="mt-2 text-ink-600">Configure quem mora com você e receba sugestões de quantidade e alertas de restrição alimentar.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="animate-rise">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">Perfil da casa</p>
        <h1 className="font-display text-[1.9rem] font-semibold text-ink-900">Quem mora com você</h1>
        <p className="mt-1.5 text-ink-600">
          Usado pra sugerir quantidades ideais ao adicionar produtos na lista, e pra avisar quando um item que você está adicionando conflita com uma restrição alimentar da casa.
        </p>
      </div>

      <Card className="animate-rise mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Moradores ({moradores.length})</h2>
          <Button variant="outline" size="sm" onClick={adicionarPessoa}>
            <Plus className="h-3.5 w-3.5" /> Adicionar pessoa
          </Button>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          {moradores.map((morador, idx) => (
            <div key={idx} className="flex items-center gap-3 rounded-xl border border-ink-900/[0.06] bg-cream-100 px-3.5 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-forest-700">
                <UserRound className="h-4 w-4" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <input
                  value={morador.nome}
                  onChange={(e) => atualizarNome(idx, e.target.value)}
                  placeholder="Nome (opcional)"
                  maxLength={30}
                  className="bg-transparent text-sm font-medium text-ink-900 outline-none placeholder:text-ink-300"
                />
                <select
                  value={morador.faixa}
                  onChange={(e) => atualizarFaixa(idx, e.target.value)}
                  className="cursor-pointer bg-transparent text-xs text-ink-500 outline-none"
                >
                  {FAIXAS_DISPONIVEIS.map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </div>
              <button onClick={() => removerPessoa(idx)} className="cursor-pointer text-ink-300 hover:text-rose-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="animate-rise mt-5 p-6">
        <h2 className="font-display text-lg font-semibold text-ink-900">Restrições alimentares</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {RESTRICOES_DISPONIVEIS.map((r) => {
            const ativo = restricoes.includes(r);
            return (
              <button
                key={r}
                onClick={() => alternarRestricao(r)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium cursor-pointer transition-colors duration-150 ${
                  ativo
                    ? "border-forest-600 bg-forest-700 text-cream-50"
                    : "border-ink-900/10 bg-paper text-ink-600 hover:border-forest-500/40"
                }`}
              >
                {ativo && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
                {r}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="animate-rise mt-6 flex items-center gap-3">
        <Button onClick={salvar}>Salvar perfil</Button>
        {salvo && <Badge tone="forest"><Check className="h-3 w-3" /> Perfil atualizado</Badge>}
      </div>
    </div>
  );
}
