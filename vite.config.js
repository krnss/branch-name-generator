import { defineConfig } from "vite";

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: "src/content.js",
      },
      output: {
        entryFileNames: "[name].js", // important for manifest to find content.js
      },
    },
    outDir: "dist",
    emptyOutDir: true,
    target: "esnext",
  },
});
