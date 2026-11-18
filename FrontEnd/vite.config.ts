import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

//Ports from .env (VITE_PORT, VITE_PROXY_TARGET) - other projects may use the defaults
export default defineConfig(({ mode }) => {

    const env = loadEnv(mode, ".", "");

    return {
        plugins: [react()],
        server: {
            host: "0.0.0.0",
            port: Number(env.VITE_PORT || 5173),
            strictPort: true,
            proxy: {
                "/api": {
                    target: env.VITE_PROXY_TARGET || "http://localhost:4000",
                    changeOrigin: true,
                    secure: false
                }
            }
        }
    };
});
