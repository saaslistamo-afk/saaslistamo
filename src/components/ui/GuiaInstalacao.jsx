import { useState } from "react";
import { X, Share, MoreVertical, SquarePlus, Smartphone } from "lucide-react";
import Button from "./Button";
import { cn } from "../../utils/cn";

const PASSOS = {
  ios: [
    { icon: Share, texto: "Abra o Listamo pelo Safari e toque no ícone de compartilhar, na barra de baixo da tela." },
    { icon: SquarePlus, texto: 'Role as opções e toque em "Adicionar à Tela de Início".' },
    { icon: Smartphone, texto: 'Toque em "Adicionar" no canto superior direito — pronto, o ícone do Listamo aparece na sua tela inicial.' },
  ],
  android: [
    { icon: MoreVertical, texto: "Abra o Listamo pelo Chrome e toque nos três pontinhos, no canto superior direito." },
    { icon: SquarePlus, texto: 'Toque em "Adicionar à tela inicial" (ou "Instalar app").' },
    { icon: Smartphone, texto: 'Confirme tocando em "Adicionar" — pronto, o ícone do Listamo aparece na sua tela inicial.' },
  ],
};

export default function GuiaInstalacao({ boasVindas = false, onFechar }) {
  const [sistema, setSistema] = useState("ios");
  const passos = PASSOS[sistema];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-md flex-col overflow-hidden rounded-2xl bg-paper shadow-lift" style={{ maxHeight: "90vh" }}>
        <button
          onClick={onFechar}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full p-1.5 text-cream-50/80 hover:bg-cream-50/15 hover:text-cream-50"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="bg-forest-700 px-6 py-8 text-center text-cream-50">
          {boasVindas && (
            <p className="text-xs font-semibold uppercase tracking-widest text-forest-200/80">Bem-vindo ao Premium</p>
          )}
          <h2 className="mt-2 font-display text-2xl font-semibold">Ative os avisos da despensa</h2>
          <p className="mt-1.5 text-sm text-forest-200/90">
            Pra receber notificação mesmo com o app fechado, adicione o Listamo à tela inicial do seu celular.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mb-5 flex gap-2 rounded-full bg-cream-100 p-1">
            <button
              onClick={() => setSistema("ios")}
              className={cn(
                "flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors",
                sistema === "ios" ? "bg-paper text-forest-700 shadow-soft-sm" : "text-ink-500"
              )}
            >
              iPhone (iOS)
            </button>
            <button
              onClick={() => setSistema("android")}
              className={cn(
                "flex-1 cursor-pointer rounded-full py-2 text-sm font-semibold transition-colors",
                sistema === "android" ? "bg-paper text-forest-700 shadow-soft-sm" : "text-ink-500"
              )}
            >
              Android
            </button>
          </div>

          <ol className="flex flex-col gap-4">
            {passos.map((passo, i) => {
              const Icon = passo.icon;
              return (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-100 text-forest-700 font-bold text-sm">
                    {i + 1}
                  </span>
                  <div className="flex items-start gap-2.5">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                    <p className="text-sm text-ink-700">{passo.texto}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="border-t border-ink-900/[0.06] px-6 py-4">
          <Button className="w-full" onClick={onFechar}>
            {boasVindas ? "Entendi, vamos começar!" : "Fechar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
