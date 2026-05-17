import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
    base: "/AI-assisted-error-record-keeping-and-review/",
    plugins: [react()],
    server: {
        port: 5173,
    },
});
