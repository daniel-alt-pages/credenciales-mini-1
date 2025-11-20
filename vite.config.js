import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // RUTA ABSOLUTA REQUERIDA POR GITHUB PAGES para subdirectorios.
  // Vercel lo ignorará si usas un dominio propio, pero es vital para el dominio .github.io
  base: '/credenciales-mini-1/', 
  
  // ASEGURAR COMPATIBILIDAD CON FUNCIONES MODERNAS
  build: {
    target: "esnext" 
  },
  esbuild: {
    target: "esnext"
  }
})