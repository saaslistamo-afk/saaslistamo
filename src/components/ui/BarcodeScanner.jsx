import { useEffect, useRef, useState, useCallback } from "react";
import { X, Loader, Zap, ZapOff } from "lucide-react";
import Button from "./Button";

const FORMATOS_BARCODE = [
  "ean_13", "ean_8", "upc_a", "upc_e",
  "code_128", "code_39", "qr_code", "itf",
];

async function buscarProduto(codigo) {
  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v2/product/${codigo}.json`,
      { signal: AbortSignal.timeout(6000) }
    );
    const data = await res.json();
    if (data.status !== 1) return null;
    const p = data.product;
    const nome = p.product_name_pt || p.product_name || p.product_name_en || null;
    return nome ? { nome: nome.trim(), codigo } : null;
  } catch {
    return null;
  }
}

// Escaneia usando a API nativa do navegador (Chrome Android) — muito mais precisa
async function escanearNativo(videoEl, onEncontrado, sinalParar) {
  const detector = new window.BarcodeDetector({ formats: FORMATOS_BARCODE });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  async function loop() {
    if (sinalParar.parado || videoEl.readyState < 2) {
      if (!sinalParar.parado) requestAnimationFrame(loop);
      return;
    }
    canvas.width  = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    ctx.drawImage(videoEl, 0, 0);
    try {
      const resultados = await detector.detect(canvas);
      if (resultados.length > 0 && !sinalParar.parado) {
        sinalParar.parado = true;
        onEncontrado(resultados[0].rawValue);
        return;
      }
    } catch {}
    if (!sinalParar.parado) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

// Fallback com @zxing/browser para iOS e Firefox
async function escanearZxing(stream, videoEl, onEncontrado, sinalParar) {
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const reader = new BrowserMultiFormatReader();
  const controls = await reader.decodeFromStream(stream, videoEl, async (result) => {
    if (!result || sinalParar.parado) return;
    sinalParar.parado = true;
    controls.stop();
    onEncontrado(result.getText());
  });
  return controls;
}

export default function BarcodeScanner({ onScan, onCancelar }) {
  const videoRef    = useRef(null);
  const streamRef   = useRef(null);
  const sinalRef    = useRef({ parado: false });
  const controlsRef = useRef(null);

  const [etapa, setEtapa]             = useState("camera");
  const [erro, setErro]               = useState("");
  const [codigoLido, setCodigoLido]   = useState("");
  const [nomeManual, setNomeManual]   = useState("");
  const [lanterna, setLanterna]       = useState(false);
  const [temLanterna, setTemLanterna] = useState(false);
  const iniciarRef = useRef(null);

  async function toggleLanterna() {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !lanterna }] });
      setLanterna((v) => !v);
    } catch {}
  }

  async function aoEncontrarCodigo(codigo) {
    setCodigoLido(codigo);
    setEtapa("buscando");
    const produto = await buscarProduto(codigo);
    if (sinalRef.current.parado && !produto) {
      setEtapa("nao_encontrado");
    } else if (produto) {
      onScan(produto);
    } else {
      setEtapa("nao_encontrado");
    }
  }

  useEffect(() => {
    async function iniciar() {
      try {
        // tenta stream HD com câmera traseira
        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width:  { ideal: 1920 },
              height: { ideal: 1080 },
            },
          });
        } catch {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
          });
        }

        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        // lanterna disponível?
        const track = stream.getVideoTracks()[0];
        const caps  = track.getCapabilities?.() ?? {};
        setTemLanterna(!!caps.torch);

        // usa API nativa se disponível (Android Chrome), senão usa zxing (iOS)
        if ("BarcodeDetector" in window) {
          escanearNativo(videoRef.current, aoEncontrarCodigo, sinalRef.current);
        } else {
          controlsRef.current = await escanearZxing(
            stream, videoRef.current, aoEncontrarCodigo, sinalRef.current
          );
        }
      } catch (e) {
        if (e.name === "NotAllowedError") {
          setErro("Permissão de câmera negada. Habilite nas configurações do navegador.");
        } else {
          setErro("Não foi possível acessar a câmera.");
        }
      }
    }

    iniciarRef.current = iniciar;
    iniciar();
    return () => {
      sinalRef.current.parado = true;
      controlsRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function tentarNovamente() {
    sinalRef.current.parado = false;
    setEtapa("camera");
    setCodigoLido("");
    setNomeManual("");
    // reinicia a câmera e o loop de scan
    controlsRef.current?.stop?.();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (iniciarRef.current) iniciarRef.current();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-ink-900">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          autoPlay
          muted
          playsInline
        />

        {etapa === "camera" && !erro && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-52 w-72">
              <span className="absolute left-0 top-0 h-8 w-8 border-l-4 border-t-4 border-forest-400 rounded-tl-lg" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-4 border-t-4 border-forest-400 rounded-tr-lg" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-forest-400 rounded-bl-lg" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-forest-400 rounded-br-lg" />
              <span className="absolute inset-x-4 top-1/2 h-0.5 -translate-y-1/2 animate-pulse-soft bg-terracotta-400" />
            </div>
            <p className="absolute bottom-28 left-0 right-0 px-6 text-center text-sm font-medium text-cream-50/80">
              Centralize o código de barras dentro da moldura — mantenha a ~15cm
            </p>
          </div>
        )}

        {erro && (
          <div className="absolute inset-0 flex items-center justify-center px-8 text-center">
            <p className="text-sm text-cream-50/80">{erro}</p>
          </div>
        )}

        {etapa === "buscando" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-ink-900/80">
            <Loader className="h-8 w-8 animate-spin text-forest-400" />
            <p className="text-sm font-medium text-cream-50">Identificando produto...</p>
            <p className="font-mono text-xs text-cream-50/50">{codigoLido}</p>
          </div>
        )}

        {etapa === "nao_encontrado" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-ink-900/90 px-8 text-center">
            <p className="font-display text-lg font-semibold text-cream-50">Produto não identificado</p>
            <p className="text-sm text-cream-50/60">
              Código <span className="font-mono">{codigoLido}</span>
            </p>
            {/* input inline — sem fechar o scanner, sem tela branca */}
            <div className="w-full max-w-xs">
              <input
                autoFocus
                value={nomeManual}
                onChange={(e) => setNomeManual(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && nomeManual.trim() && onScan({ nome: nomeManual.trim(), codigo: codigoLido })}
                placeholder="Digite o nome do produto"
                className="w-full rounded-xl border border-cream-50/20 bg-cream-50/10 px-4 py-3 text-sm text-cream-50 outline-none placeholder:text-cream-50/40 focus:border-forest-400"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="border-cream-50/20 text-cream-50 hover:bg-cream-50/10"
                onClick={tentarNovamente}
              >
                Tentar novamente
              </Button>
              <Button
                disabled={!nomeManual.trim()}
                onClick={() => onScan({ nome: nomeManual.trim(), codigo: codigoLido })}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}

        {temLanterna && etapa === "camera" && (
          <button
            onClick={toggleLanterna}
            className="absolute bottom-28 right-6 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-ink-900/60 text-cream-50 backdrop-blur-sm hover:bg-ink-900/80"
          >
            {lanterna ? <ZapOff className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
          </button>
        )}
      </div>

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
