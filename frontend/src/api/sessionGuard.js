// Ogni fetch dell'app usa il cookie httpOnly per l'autenticazione (nessun client
// HTTP centralizzato, nessun refresh token). Quando il cookie scade, il backend
// risponde 401 a qualsiasi richiesta successiva, ma finora nessuno se ne accorgeva:
// la UI restava sulla pagina con dati vecchi/mancanti invece di sloggare l'utente.
// Questo modulo intercetta tutte le fetch dell'app (patchando window.fetch una sola
// volta) per reagire ai 401 senza dover toccare le decine di redux action esistenti.
let installed = false;

export function installSessionGuard(onSessionExpired) {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    if (response.status === 401) {
      const url = typeof input === "string" ? input : input?.url || "";
      // Login/logout gestiscono da soli i propri 401 (credenziali errate, o
      // logout su una sessione gia' scaduta): non sono un "session expired" reale.
      const isAuthLifecycleCall = url.includes("/api/auth/login") || url.includes("/api/auth/logout");
      if (!isAuthLifecycleCall) onSessionExpired();
    }
    return response;
  };
}
