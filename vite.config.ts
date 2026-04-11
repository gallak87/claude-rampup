import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/ec-proxy': {
        target: 'https://videos-3.earthcam.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ec-proxy/, ''),
        headers: {
          Referer: 'https://www.earthcam.com/',
          Origin: 'https://www.earthcam.com',
        },
      },
      '/ec-arch': {
        target: 'https://video2archives.earthcam.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/ec-arch/, ''),
        headers: {
          Referer: 'https://www.earthcam.com/',
          Origin: 'https://www.earthcam.com',
        },
      },
    },
  },
})
