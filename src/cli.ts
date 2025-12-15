#!/usr/bin/env bun
import { createKilat, KilatConfig } from "./index";

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

if (!command) {
    console.error("Please specify a command: dev or build");
    process.exit(1);
}

// Helper to load config
async function loadConfig(): Promise<Partial<KilatConfig>> {
    const configPath = `${process.cwd()}/kilat.config.ts`;
    
    // Check if config exists
    const file = Bun.file(configPath);
    if (!(await file.exists())) {
        console.warn("⚠️ No kilat.config.ts found, using defaults");
        return {};
    }

    try {
        const configModule = await import(configPath);
        return configModule.default || configModule;
    } catch (error) {
        console.error("Failed to load config:", error);
        return {};
    }
}

async function main() {
    const config = await loadConfig();
    const server = createKilat(config);

    switch (command) {
        case "dev":
            const isProduction = args.includes("--production");
            console.log(`Starting server (${isProduction ? "Hybrid Production" : "Development"})...`);
            const devServer = createKilat({ ...config, dev: !isProduction });
            await devServer.start();
            break;
            
        case "build":
            console.log("Building for production...");
            await server.buildStatic();
            break;

        case "preview":
            const outDir = config.outDir || "./dist";
            const port = config.port || 3000;
            const hostname = config.hostname || "localhost";
            const root = `${import.meta.dir}/../${outDir}`;

            console.log(`\nLocal preview server running:`);
            console.log(`➜  http://${hostname}:${port}`);
            console.log(`Serving: ${root}\n`);

            Bun.serve({
                port,
                hostname,
                async fetch(req) {
                    const url = new URL(req.url);
                    let path = url.pathname;
                    
                    // 1. Try exact path
                    const filePath = `${root}${path}`;
                    let file = Bun.file(filePath);
                    if (await file.exists()) {
                         return new Response(file);
                    }

                    // 2. Try index.html
                    const indexHtml = `${filePath}/index.html`;
                    file = Bun.file(indexHtml);
                    if (await file.exists()) {
                        return new Response(file);
                    }

                    // 3. Try root index.html for SPA fallback
                    const rootIndex = `${root}/index.html`;
                    file = Bun.file(rootIndex);
                    if (await file.exists()) {
                        return new Response(file);
                    }

                    // 404
                    return new Response("404 Not Found", { status: 404 });
                }
            });
            break;
            
        default:
            console.error(`Unknown command: ${command}`);
            console.log("Available commands: dev, build");
            process.exit(1);
    }
}

main().catch(error => {
    console.error("Fatal error:", error);
    process.exit(1);
});
