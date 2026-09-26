// TEMPORARY local verification harness - not committed. Delete after use.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";
const SLIM = process.env.SLIM_DATA as string;
const PORT = parseInt(process.env.VPORT || "8092", 10);
const MODE = process.env.API_MODE || "data";
export default defineConfig({
  base: "/",
  cacheDir: `node_modules/.vite-verify-${PORT}`,
  optimizeDeps: { entries: ["verify-dash.html"] },
  server: { host: "127.0.0.1", port: PORT, strictPort: true },
  plugins: [react(), { name: "verify-api", configureServer(server) { server.middlewares.use("/api/fetch-data", (_req, res) => {
    if (MODE === "503") { res.statusCode = 503; res.end("The deployment is currently unavailable"); return; }
    res.setHeader("content-type", "application/json"); res.end(fs.readFileSync(SLIM)); }); } }],
  resolve: { alias: [
    { find: "@/context/AuthContext", replacement: path.resolve(__dirname, "verify-stub-auth.tsx") },
    { find: "@", replacement: path.resolve(__dirname, "src") },
  ] },
});
