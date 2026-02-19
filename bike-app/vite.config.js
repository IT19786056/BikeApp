import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // This allows the Firebase popup to talk to your main app window
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
})
