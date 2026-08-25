import { useState } from "react";
import { useApp } from "../context/AppContext";
import { useWebPush } from "./useWebPush";

// Compartilhado entre a Dashboard e Configurações de perfil — ligar/desligar
// em um lugar reflete no outro, porque os dois leem/escrevem o mesmo estado
// (notificacoes) do AppContext.
export function useNotificacaoToggle() {
  const { notificacoes, setNotificacoes } = useApp();
  const { solicitarPermissao, cancelarSubscription } = useWebPush();
  const [erro, setErro] = useState("");

  async function atualizarNotif(chave, valor) {
    setNotificacoes((prev) => ({ ...prev, [chave]: valor }));
    setErro("");
    if (valor) {
      const resultado = await solicitarPermissao();
      if (!resultado.ok) {
        setErro(resultado.motivo);
        setNotificacoes((prev) => ({ ...prev, [chave]: false }));
      }
    } else {
      const algumAtivo = Object.entries(notificacoes).some(([k, v]) => k !== "horario" && k !== chave && v);
      if (!algumAtivo) await cancelarSubscription();
    }
  }

  function atualizarHorario(novoHorario) {
    setNotificacoes((prev) => ({ ...prev, horario: novoHorario }));
  }

  // Salva a frequência do alerta de validade e seus horários/dias de uma vez.
  // Quando frequencia é "unica", também atualiza o horário compartilhado
  // (o mesmo usado por orçamento/resumo diário), mantendo o comportamento legado.
  function atualizarConfigValidade({ frequencia, horario, alertas, antecedenciaDias }) {
    setNotificacoes((prev) => ({
      ...prev,
      validadeFrequencia: frequencia,
      validadeAlertas: frequencia === "unica" ? [] : alertas,
      antecedenciaDias,
      ...(frequencia === "unica" ? { horario } : {}),
    }));
  }

  return { notificacoes, atualizarNotif, atualizarHorario, atualizarConfigValidade, erro };
}
