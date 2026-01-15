import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 额外配置：忽略一些 Tauri 特有的监听报错
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
  },
});