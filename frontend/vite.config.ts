import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      watch: {
        usePolling: true,
      },
      hmr: {
        overlay: true
      },
      proxy: {
        '/api': {
          target: `http://localhost:${env.VITE_API_PORT || 5500}`,
          changeOrigin: true,
          secure: false //TODO: Change later, for deliver / production, to enable SSL
        }
      }
    }
  }
})