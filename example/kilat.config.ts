import { defineConfig } from "../src/index";

export default defineConfig({
    routesDir: "./src/routes",
    outDir: "./dist",
    port: 3000,
    hostname: "localhost",
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./styles.css",
    },
});
