import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/credenciales-mini-1/", // Tu repositorio
  build: {
    target: "esnext" // Permite características modernas como import.meta
  },
  esbuild: {
    target: "esnext" // Asegura que el compilador entienda la sintaxis nueva
  }
})