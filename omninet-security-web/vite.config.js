import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tailwindcss()],
    define: {
        global: 'globalThis',
    },
    optimizeDeps: {
        include: ['sockjs-client', 'stompjs']
    },
    server: {
        allowedHosts: ['site.udaykhare.social', 'localhost:5173'],
        port: 5173,
        host: '127.0.0.1'
    }

})