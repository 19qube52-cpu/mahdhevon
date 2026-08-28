/// <reference types="vitest" />
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react() as any, tailwindcss() as any],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) return "charts"
          if (id.includes("node_modules/@supabase")) return "supabase"
          if (id.includes("node_modules/@radix-ui") || id.includes("node_modules/radix-ui")) return "radix"
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react-vendor"
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
