import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { X, Loader } from "lucide-react";
import Button from "./Button";

// consulta o Open Food Facts pra descobrir o nome do produto pelo código de barras
async function buscarProduto(codigo) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codigo}.json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const nome =
      p.product_name_pt ||
      p.product_name ||
      p.product_name_en ||
      null;
    return nome ? { nome: nome.trim(), codigo } : null;
  } catch {
    return null;
  }
}

export default function BarcodeScanner({ onScan, onCancelar }) {
  const videoRef    = useRef(null);
  const controlsRef = useRef(null);
  const [etapa, setEtapa]     = useState("camera"); // "camera" | "buscando" | "nao_encontrado"
  const [erro, setErro]       = useState("");
  const [codigoLido, setCodigoLido] = useState("");

  useEffect(() => {
    let ativo = true;
    const reader = new BrowserMultiFormatReader();

    async function iniciar() {
      try {
        const controls = await reader.decodeFromVideoDevice(
          undefined, // câmera traseira por padrão em mobile
          videoRef.current,
          async (result, err) => {
            if (!result || !ativo) return;
            // barcode detectado — para a câmera e busca o produto
            controls.stop();
            const codigo = result.getText();
            setCodigoLido(codigo);
            setEtapa("buscando");
            const produto = await buscarProduto(codigo);
            if (!ativo) return;
            if (produto) {
              onScan(produto); // { nome, codigo }
            } else {
              setEtapa("nao_encontrado");
            }
          }
        );
        if (ativo) controlsRef.current = controls;
      } catch (e) {
        if (!ativo) return;
        if (e.name === "NotAllowedError") {
          setErro("Permissão de câmera negada. Habilite nas configurações do navegador.");
        } else {
          setErro("Não foi possível acessar a câmera.");
        }
      }
    }

    iniciar();
    return () => {
      ativo = false;
      controlsRef.current?.stop();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900">
      {/* vídeo da câmera */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {/* mira de leitura */}
        {etapa === "camera" && !erro && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-56 w-72">
              {/* cantos da mira */}
              <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-forest-400 rounded-tl-lg" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-forest-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-forest-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-forest-400 rounded-br-lg" />
              {/* linha de leitura */}
              <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 animate-pulse-soft bg-terracotta-400" />
            </div>
            <p className="absolute bottom-24 left-0 right-0 text-center text-sm font-medium text-cream-50/80">
              Aponte para o código de barras do produto
            </p>
          </div>
        )}

        {/* erro de câmera */}
        {erro && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <p className="text-sm text-cream-50/80">{erro}</p>
          </div>
        )}

        {/* buscando produto */}
        {etapa === "buscando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900/80">
            <Loader className="h-8 w-8 animate-spin text-forest-400" />
            <p className="text-sm font-medium text-cream-50">Identificando produto...</p>
            <p className="text-xs text-cream-50/50 font-mono">{codigoLido}</p>
          </div>
        )}

        {/* produto não encontrado na base */}
        {etapa === "nao_encontrado" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-900/80 px-8 text-center">
            <p className="font-display text-lg font-semibold text-cream-50">
              Produto não identificado
            </p>
            <p className="text-sm text-cream-50/70">
              Código <span className="font-mono text-cream-50/90">{codigoLido}</span> não encontrado na base. Adicione o nome manualmente.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="border-cream-50/20 text-cream-50 hover:bg-cream-50/10" onClick={() => {
                setEtapa("camera");
                // reinicia o scanner
                const reader = new BrowserMultiFormatReader();
                reader.decodeFromVideoDevice(undefined, videoRef.current, async (result) => {
                  if (!result) return;
                  const codigo = result.getText();
                  setCodigoLido(codigo);
                  setEtapa("buscando");
                  const produto = await buscarProduto(codigo);
                  if (produto) onScan(produto);
                  else setEtapa("nao_encontrado");
                }).then(c => { controlsRef.current = c; });
              }}>
                Tentar novamente
              </Button>
              <Button onClick={() => onScan({ nome: "", codigo: codigoLido })}>
                Digitar nome
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* botão fechar */}
      <div className="flex items-center justify-center bg-ink-900 p-6">
        <button
          onClick={onCancelar}
          className="flex cursor-pointer items-center gap-2 rounded-full border border-cream-50/20 px-5 py-2.5 text-sm font-medium text-cream-50 hover:bg-cream-50/10"
        >
          <X className="h-4 w-4" /> Cancelar
        </button>
      </div>
    </div>
  );
}
