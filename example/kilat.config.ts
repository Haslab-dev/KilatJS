import { defineConfig } from "kilatjs";

export default defineConfig({
    appDir: "./src",  // Auto-detects routes/ or pages/ folder inside
    outDir: "./dist",
    port: 3000,
    hostname: "localhost",
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./styles.css",
    },
});
