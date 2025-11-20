import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // REEMPLAZAMOS './' por la ruta ABSOLUTA del repositorio.
  // Esto SOLUCIONA la pantalla blanca en GitHub Pages.
  base: '/credenciales-mini-1/', 
  build: {
    target: "esnext"
  },
  esbuild: {
    target: "esnext"
  }
})