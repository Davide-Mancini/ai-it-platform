// Deriva l'host del backend da quello con cui e' stata caricata la pagina:
// cosi' l'app funziona sia da localhost sia aprendola da un altro dispositivo
// sulla stessa rete (es. http://192.168.1.x:5173) senza bisogno di configurare
// nulla manualmente.
export const API_BASE = `http://${window.location.hostname}:8000`;
