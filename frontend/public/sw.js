// ── Lifecycle ────────────────────────────────────────────────────────────────
//
// "install" scatta quando il browser scarica una nuova versione di sw.js.
// skipWaiting() dice al browser: attiva subito questa versione invece di
// aspettare che tutte le tab vengano chiuse. Senza questa riga, ogni volta
// che aggiorni sw.js la nuova versione resta in stato "waiting" e il vecchio
// SW continua a gestire le push — causando comportamenti inconsistenti.
self.addEventListener("install", () => self.skipWaiting());

// "activate" scatta quando il nuovo SW prende il controllo.
// clients.claim() fa sì che il nuovo SW controlli immediatamente tutte le
// tab già aperte, senza aspettare che vengano ricaricate.
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// ── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "Heximus", message: event.data.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.message,
      icon: "/favicon-96x96.png",
      badge: "/favicon-96x96.png",
      tag: data.id || "heximus-notification",
      data: {
        url: data.url || "/",
      },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Altrimenti apriamo una nuova tab
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      }),
  );
});
