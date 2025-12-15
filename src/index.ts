// KilatJS - A Bun-native, HTML-first framework
// Main entry point

export { Router } from "./core/router";
export { KilatServer } from "./server/server";
export { ReactAdapter } from "./adapters/react";
export { HTMXAdapter, type HTMXResponseOptions } from "./adapters/htmx";
// Note: Additional adapters can be added in the adapters directory
export * from "./core/types";

import { KilatServer } from "./server/server";
import { KilatConfig, TailwindConfig } from "./core/types";

/**
 * Default configuration for KilatJS
 */
export const defaultConfig: KilatConfig = {
    routesDir: "./routes",
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

// Default export for import Kilat from 'kilatjs'
const Kilat = {
    createKilat,
    startDevServer,
    buildStatic,
    defineConfig,
    defineLoader,
    defineMeta,
    defaultConfig,
};

export default Kilat;