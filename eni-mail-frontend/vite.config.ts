import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      // Backend ENI Mail. Doit correspondre a SERVER_PORT dans eni-mail-back/.env
      // (defaut 8088 - 8080 est souvent occupe par un autre service local).
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:8089',
        changeOrigin: true,
      },
    },
  },
})
