import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

export default defineConfig({
    plugins: [
        react(),
        checker({
            typescript: true,
            eslint: {
                lintCommand: "eslint ./src --ext .ts,.tsx,.js,.jsx"
            },
        }),
    ],
    server: {
        port: 8000,
        host: true,
        proxy: {
            "/api/v1": "http://backend:3000",
            "/external": "http://backend:3000",
        },
        watch: {
            usePolling: true,
            interval: 100,
        },
    },
    build: {
        outDir: "build",
    },
});