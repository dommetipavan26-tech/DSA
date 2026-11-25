import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  // The published build is intentionally one self-contained index.html so the
  // app can be opened from the file system or hosted on any static server.
  plugins: [react(), tailwindcss(), viteSingleFile({ removeViteModuleLoader: true })],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true,
  },
})
