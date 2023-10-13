import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";

const noCrossorigin = () => {
  return {
    name: "no-attribute",
    transformIndexHtml(html) {
      return html.replace(" crossorigin ", " ");
    },
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [react(), noCrossorigin(), visualizer()],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
  },
});
