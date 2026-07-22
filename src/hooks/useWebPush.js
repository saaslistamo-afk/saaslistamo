import { useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function useWebPush() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Retorna { ok, motivo } em vez de só true/false — sem isso, qualquer
  // falha (navegador sem suporte, permissão já negada antes, erro ao
  // inscrever) acontecia em silêncio total, sem nenhum aviso na tela.
  const solicitarPermissao = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return { ok: false, motivo: "Seu navegador não suporta notificações push (verifique se o app foi adicionado à Tela de Início)." };
    }
    if (Notification.permission === "denied") {
      return { ok: false, motivo: "A notificação já foi negada antes. Ative manualmente em Ajustes do iPhone → Listamo → Notificações." };
    }
    if (!VAPID_PUBLIC_KEY) {
      return { ok: false, motivo: "Configuração de notificação ausente no servidor (chave VAPID)." };
    }

    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") {
      return { ok: false, motivo: "Permissão de notificação não concedida." };
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from("push_subscriptions").upsert(
          { user_id: user.id, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
        if (error) return { ok: false, motivo: `Erro ao salvar inscrição: ${error.message}` };
      }
      return { ok: true, motivo: "" };
    } catch (e) {
      return { ok: false, motivo: `Erro ao ativar push: ${e?.message || e}` };
    }
  }, []);

  const cancelarSubscription = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("push_subscriptions").delete().eq("user_id", user.id);
    } catch {}
  }, []);

  const notificarLocal = useCallback(async (title, body, url = "/dashboard") => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url },
    });
  }, []);

  return { solicitarPermissao, cancelarSubscription, notificarLocal };
}
