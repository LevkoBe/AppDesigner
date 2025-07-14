import { defineConfig } from "vite";

export default defineConfig({
  root: "./",
  base: "/AppDesigner/",
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: "./index.html",
    },
  },
});
