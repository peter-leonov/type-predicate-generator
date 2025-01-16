import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // match the GH Pages expectations
    emptyOutDir: true,
    outDir: "../docs",
  },
  base: "/type-predicate-generator/",
});
