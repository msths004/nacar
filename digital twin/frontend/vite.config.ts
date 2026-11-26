import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

function fileProtocolCompatibilityPlugin(): Plugin {
  const buildId = String(Date.now());
  return {
    name: "file-protocol-compat",
    enforce: "post",
    transformIndexHtml(html) {
      const liveWatcherScript = `<script>
(function(){
  var currentId = "${buildId}";
  window.__NACAR_BUILD_ID__ = currentId;
  setInterval(function(){
    var s = document.createElement("script");
    s.src = "./build-version.js?t=" + Date.now();
    s.onload = function(){
      if (window.__NACAR_BUILD_ID__ && window.__NACAR_BUILD_ID__ !== currentId) {
        window.location.reload();
      }
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    s.onerror = function(){
      if (s.parentNode) s.parentNode.removeChild(s);
    };
    document.head.appendChild(s);
  }, 1500);
})();
</script>`;
      return html
        .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
        .replace(/<link rel="stylesheet" crossorigin href="([^"]+)">/g, '<link rel="stylesheet" href="$1">')
        .replace("</body>", `${liveWatcherScript}</body>`);
    },
    closeBundle() {
      const outFile = path.resolve(__dirname, "dist", "build-version.js");
      fs.mkdirSync(path.dirname(outFile), { recursive: true });
      fs.writeFileSync(outFile, `window.__NACAR_BUILD_ID__ = "${buildId}";\n`, "utf-8");
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), fileProtocolCompatibilityPlugin()],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    sourcemap: false,
    modulePreload: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        format: "iife",
        name: "NacarDigitalTwinApp",
        inlineDynamicImports: true,
      },
    },
  },
});
