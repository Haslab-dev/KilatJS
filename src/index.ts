// KilatJS - A Bun-native, HTML-first framework
// Main entry point

export { Router } from "./core/router";
export { KilatServer } from "./server/server";
export { ReactAdapter } from "./adapters/react";
export { HTMXAdapter, type HTMXResponseOptions } from "./adapters/htmx";
export { startLiveReload, stopLiveReload, notifyReload } from "./server/live-reload";
export * from "./core/types";

import { KilatServer } from "./server/server";
import { KilatConfig, TailwindConfig } from "./core/types";

/**
 * Default configuration for KilatJS
 */
export const defaultConfig: KilatConfig = {
    appDir: "./src",
    outDir: "./dist",
    port: 3000,
    hostname: "localhost",
    dev: false,
    tailwind: {
        enabled: false,
        cssPath: "./styles.css",
    },
};

/**
 * Create a Kilat instance with custom configuration
 */
export function createKilat(config: Partial<KilatConfig> = {}): KilatServer {
    const tailwindConfig: TailwindConfig = {
        enabled: config.tailwind?.enabled ?? defaultConfig.tailwind?.enabled ?? false,
        inputPath: config.tailwind?.inputPath,
        cssPath: config.tailwind?.cssPath ?? defaultConfig.tailwind?.cssPath ?? "./styles.css",
        configPath: config.tailwind?.configPath ?? defaultConfig.tailwind?.configPath,
    };
    const finalConfig: KilatConfig = {
        ...defaultConfig,
        ...config,
        tailwind: tailwindConfig,
    };
    return new KilatServer(finalConfig);
}

/**
 * Start the development server
 */
export async function startDevServer(config: Partial<KilatConfig> = {}) {
    const server = createKilat({ ...config, dev: true });
    return server.start();
}

/**
 * Build static site
 */
export async function buildStatic(config: Partial<KilatConfig> = {}) {
    const server = createKilat(config);
    return server.buildStatic();
}

/**
 * Define a route loader with type inference
 */
export function defineLoader<T>(loader: (ctx: import("./core/types").RouteContext) => Promise<T> | T) {
    return loader;
}

/**
 * Define configuration with type inference
 */
export function defineConfig(config: Partial<KilatConfig>) {
    return config;
}

/**
 * Define route meta with type inference
 */
export function defineMeta(meta: import("./core/types").RouteMeta) {
    return meta;
}

/**
 * CLI functionality - can be used programmatically
 */
export async function runCLI(args: string[] = process.argv.slice(2)) {
    const command = args[0];
    
    if (!command) {
        console.error("Please specify a command: dev or build");
        process.exit(1);
    }

    // Helper to load config
    async function loadConfig(): Promise<Partial<KilatConfig>> {
        const configPath = `${process.cwd()}/kilat.config.ts`;
        
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

    const config = await loadConfig();

    switch (command) {
        case "dev":
            const isProduction = args.includes("--production");
            // Silent start - server will print its own message
            const devServer = createKilat({ ...config, dev: !isProduction });
            await devServer.start();
            break;
            
        case "build":
            await buildStatic(config);
            break;

        case "serve":
            // Run the production server from dist
            const serveOutDir = config.outDir || "./dist";
            const serverPath = `${process.cwd()}/${serveOutDir}/server.js`;
            
            const serverFile = Bun.file(serverPath);
            if (!(await serverFile.exists())) {
                console.error(`❌ Production server not found at ${serveOutDir}/server.js`);
                console.error(`   Run 'kilat build' first to generate the production build.`);
                process.exit(1);
            }

            // Run the production server
            const serveProc = Bun.spawn(["bun", serverPath], {
                stdio: ["inherit", "inherit", "inherit"],
                cwd: process.cwd(),
            });
            
            await serveProc.exited;
            break;

        case "preview":
            const outDir = config.outDir || "./dist";
            const port = config.port || 3000;
            const hostname = config.hostname || "localhost";
            const root = `${process.cwd()}/${outDir}`;

            console.log(`\n🔍 Preview server running:`);
            console.log(`   ➜ http://${hostname}:${port}`);
            console.log(`   Serving: ${outDir}\n`);

            Bun.serve({
                port,
                hostname,
                async fetch(req) {
                    const url = new URL(req.url);
                    let path = url.pathname;
                    
                    const filePath = `${root}${path}`;
                    let file = Bun.file(filePath);
                    if (await file.exists()) {
                         return new Response(file);
                    }

                    const indexHtml = `${filePath}/index.html`;
                    file = Bun.file(indexHtml);
                    if (await file.exists()) {
                        return new Response(file);
                    }

                    const rootIndex = `${root}/index.html`;
                    file = Bun.file(rootIndex);
                    if (await file.exists()) {
                        return new Response(file);
                    }

                    return new Response("404 Not Found", { status: 404 });
                }
            });
            break;
            
        default:
            console.error(`Unknown command: ${command}`);
            console.log("Available commands: dev, build, serve, preview");
            process.exit(1);
    }
}

// Default export
const Kilat = {
    createKilat,
    startDevServer,
    buildStatic,
    defineConfig,
    defineLoader,
    defineMeta,
    runCLI,
    defaultConfig,
};

export default Kilat;
