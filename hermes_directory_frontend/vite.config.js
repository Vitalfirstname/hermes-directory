import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,      // чтобы был доступен по сети
    port: 5173,
    proxy: {
      "/api": {
        target: 'http://192.168.100.30:8000',
        changeOrigin: true,
        // secure: false, // обычно не нужно (для https)
      },
      // если у тебя еще есть media/static эндпоинты:
      // '/media': { target: 'http://192.168.100.30:8000', changeOrigin: true },
      // '/static': { target: 'http://192.168.100.30:8000', changeOrigin: true },
    },
  },
})
