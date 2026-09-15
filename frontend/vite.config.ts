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
          // One chunk per grammar: Shiki loads on demand from CodeBlock, and no
          // single chunk crosses Rollup's 500 kB warning.
          const lang = id.match(/(?:@shikijs[\\/]langs[\\/]dist|shiki[\\/]dist[\\/]langs)[\\/]([\w-]+)\.mjs/);
          // bash.mjs only re-exports shellscript; share its chunk instead of emitting an empty one.
          if (lang) return `shiki-lang-${lang[1] === "bash" ? "shellscript" : lang[1]}`;
          if (/shiki|oniguruma|@shikijs|vscode-textmate|vscode-oniguruma/.test(id))
            return "shiki";
          if (/react|scheduler|@tanstack/.test(id)) return "vendor";
        },
      },
    },
  },
  // The Shiki highlighter runs in a module Web Worker (src/lib/shiki.worker.ts).
  worker: {
    format: "es",
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
