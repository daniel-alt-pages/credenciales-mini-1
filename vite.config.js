import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // CORRECCIÓN FINAL: Cambiamos la base a una cadena vacía. 
  // Esto hace que Vite use la raíz del dominio, que es lo que Vercel necesita 
  // para encontrar los archivos JS/CSS y dejar de mostrar la pantalla blanca.
  base: '', 
  
  // ASEGURAR COMPATIBILIDAD CON FUNCIONES MODERNAS
  build: {
    target: "esnext" 
  },
  esbuild: {
    target: "esnext"
  }
})

// Actualizacion forzada