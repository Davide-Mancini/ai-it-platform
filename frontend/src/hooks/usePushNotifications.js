import { useState, useEffect, useCallback } from "react";

const API_BASE = "http://localhost:8000";

// Converte una stringa base64url (come la VAPID public key) in Uint8Array.
// pushManager.subscribe() richiede esattamente questo formato.
function urlBase64ToUint8Array(base64url) {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64  = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw     = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(token) {
  const [enabled, setEnabled]   = useState(false);
  const [loading, setLoading]   = useState(true);  // true durante il controllo iniziale
  const [error, setError]       = useState("");

  // ── Controllo iniziale ────────────────────────────────────────────────────
  // Al mount del hook controlliamo se il browser ha già una subscription attiva.
  // Questo permette al toggle di partire nello stato corretto (ON/OFF)
  // anche se l'utente ha già abilitato le push in una sessione precedente.
  useEffect(() => {
    if (!token) return;

    // Push API non supportata da questo browser (es. Safari < 16)
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setLoading(false);
      return;
    }

    // getRegistration() risponde subito con undefined se nessun SW è registrato.
    // serviceWorker.ready invece aspetta all'infinito finché un SW non è attivo,
    // causando loading=true permanente al primo avvio (nessun SW ancora installato).
    navigator.serviceWorker.getRegistration("/sw.js")
      .then((reg) => reg ? reg.pushManager.getSubscription() : null)
      .then((sub) => setEnabled(!!sub))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Abilitazione ─────────────────────────────────────────────────────────
  const enable = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      // 1. Chiediamo il permesso all'utente.
      //    Può rispondere: "granted" | "denied" | "default"
      //    Se ha già risposto in passato, il browser restituisce subito la risposta
      //    senza mostrare il popup.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError(
          permission === "denied"
            ? "Hai bloccato le notifiche. Per abilitarle vai nelle impostazioni del browser."
            : "Permesso non concesso."
        );
        return;
      }

      // 2. Registriamo il Service Worker (se non è già registrato).
      //    Il browser lo scarica, installa e lo tiene in background.
      //    Le chiamate successive a register() con lo stesso path sono no-op.
      const reg = await navigator.serviceWorker.register("/sw.js");

      // 3. Recuperiamo la VAPID public key dal backend.
      //    Il Push Service di Google/Mozilla la userà per verificare
      //    che i messaggi vengano davvero dal nostro server.
      const keyRes = await fetch(`${API_BASE}/api/auth/push-vapid-key`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!keyRes.ok) throw new Error("Impossibile recuperare la chiave VAPID.");
      const { public_key } = await keyRes.json();

      // 4. Chiediamo al Push Service (Google/Mozilla) una subscription.
      //    Internamente il browser:
      //      a. Contatta il Push Service con la nostra VAPID public key
      //      b. Riceve un endpoint URL univoco per questo browser
      //      c. Genera le chiavi p256dh e auth per la cifratura end-to-end
      //    Il risultato è l'oggetto PushSubscription.
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly:     true,           // obbligatorio: ogni push deve mostrare una notifica
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });

      // 5. Salviamo la subscription nel nostro backend.
      //    Da questo momento il server sa a quale endpoint mandare i push per questo utente.
      const subJson = subscription.toJSON();
      await fetch(`${API_BASE}/api/auth/push-subscribe`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          p256dh:   subJson.keys.p256dh,
          auth:     subJson.keys.auth,
        }),
      });

      setEnabled(true);
    } catch (e) {
      setError(e.message || "Errore durante l'attivazione delle notifiche push.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Disabilitazione ───────────────────────────────────────────────────────
  const disable = useCallback(async () => {
    setError("");
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration("/sw.js");
      const subscription = reg ? await reg.pushManager.getSubscription() : null;

      if (subscription) {
        const subJson = subscription.toJSON();

        // 1. Diciamo al Push Service di non consegnare più push a questo endpoint.
        await subscription.unsubscribe();

        // 2. Rimuoviamo la subscription dal nostro DB.
        await fetch(`${API_BASE}/api/auth/push-unsubscribe`, {
          method:  "DELETE",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            endpoint: subJson.endpoint,
            p256dh:   subJson.keys.p256dh,
            auth:     subJson.keys.auth,
          }),
        });
      }

      setEnabled(false);
    } catch (e) {
      setError(e.message || "Errore durante la disattivazione.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  return { enabled, loading, error, enable, disable };
}
