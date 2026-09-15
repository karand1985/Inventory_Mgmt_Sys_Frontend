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
    // Same developer owns both repos here, so the SPA is bundled into the
    // backend jar (unlike ServiceRight-UI, which is owned by a separate FE dev
    // and therefore deployed independently behind its own Nginx).
    outDir: '../Inventory_Mgmt_Sys_Backend/src/main/resources/static',
    emptyOutDir: true
  }
})
