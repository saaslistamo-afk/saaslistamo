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

  const solicitarPermissao = useCallback(async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return false;
    }
    const permissao = await Notification.requestPermission();
    if (permissao !== "granted") return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("push_subscriptions").upsert(
          { user_id: user.id, subscription: JSON.stringify(subscription), updated_at: new Date().toISOString() },
          { onConflict: "user_id" }
        );
      }
      return true;
    } catch {
      return false;
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
    if (!("serviceWorker" in navigator) || Notification.permission !== "granted") return;
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
