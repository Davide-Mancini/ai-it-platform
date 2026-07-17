import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    // Su bind mount Docker/Windows gli eventi filesystem nativi spesso non
    // arrivano al watcher di Vite, lasciando il dev server servire versioni
    // stale dei file finché non viene riavviato manualmente. Il polling
    // forza un controllo periodico che funziona sempre in questo setup.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
})
