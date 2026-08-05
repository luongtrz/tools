import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    base: env.VITE_ASSET_BASE || "/",
    plugins: [react(), tailwindcss()],
    build: {
      target: "es2020",
    },
  };
});
