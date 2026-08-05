import { useEffect } from "react";

// Sem travar o scroll do <body>, no iOS um overlay fixed some/"descola" da
// tela durante o scroll (o fundo rola por trás enquanto o fixed tenta
// acompanhar) — some celular chega a mostrar uma faixa em branco por cima
// de tudo. Trava o scroll do fundo enquanto o modal estiver aberto.
export function useTravarScroll(ativo) {
  useEffect(() => {
    if (!ativo) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [ativo]);
}
