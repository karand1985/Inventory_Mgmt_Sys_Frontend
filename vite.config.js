import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8080'
    }
  },
  build: {
    // Output straight into the Spring Boot static resources folder so the
    // backend serves this build directly, per the single-jar hosting decision.
    outDir: '../inventory-system/src/main/resources/static',
    emptyOutDir: true
  }
})
