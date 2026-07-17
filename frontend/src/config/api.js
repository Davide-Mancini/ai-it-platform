// In produzione frontend e backend vivono su domini diversi (es. Vercel +
// Render), quindi l'URL va fornito a build-time via VITE_API_URL. In sua
// assenza (sviluppo locale/LAN) si deriva l'host del backend da quello con
// cui e' stata caricata la pagina, cosi' l'app funziona sia da localhost sia
// aprendola da un altro dispositivo sulla stessa rete (es. http://192.168.1.x:5173)
// senza bisogno di configurare nulla manualmente.
export const API_BASE = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000`;
