import { defineConfig } from "kilatjs";

export default defineConfig({
    appDir: ".",
    outDir: "./dist",
    port: 3000,
    hostname: "localhost",
    ssrRoot: true,
    clientRoute: "/client",
    publicDir: "./public",
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./public/styles.css",
    },
});
