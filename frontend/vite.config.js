import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  //allow all servers to access the frontend
  cors: true,
  server: {
    allowedHosts: ['localhost', '127.0.0.1', '0.0.0.0', '192.168.1.100', '590475de013a.ngrok-free.app'],// allow all Hosts
    host: '0.0.0.0', // Allow external connections
    cors: true,
    port: 5174,
  },
})
