import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// The API runs on :8077 (see backend). In dev we proxy /api there so the
// frontend can use same-origin requests (cookies "just work", no CORS dance).
const API_TARGET = process.env.VITE_API_TARGET || "http://127.0.0.1:8077";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (/shiki|oniguruma|@shikijs|vscode-textmate|vscode-oniguruma/.test(id))
            return "shiki";
          if (/framer-motion|(\/|\\)motion(\/|\\)/.test(id)) return "motion";
          if (/react|scheduler|@tanstack/.test(id)) return "vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: API_TARGET,
        changeOrigin: true,
      },
    },
  },
});
