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

    const config = (command === "create" || command === "init") ? {} : await loadConfig();

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

        case "init":
        case "create":
            const projectName = args[1] || ".";
            const targetDir = projectName === "." ? process.cwd() : `${process.cwd()}/${projectName}`;
            
            console.log(`\n⚡ Creating KilatJS project in ${projectName}...\n`);

            // Create directories
            const dirs = [
                "public",
                "routes",
                "routes/api",
                "components"
            ];

            for (const dir of dirs) {
                const dirPath = `${targetDir}/${dir}`;
                await Bun.spawn(["mkdir", "-p", dirPath]).exited;
            }

            // Templates
            const files = {
                "package.json": JSON.stringify({
                    name: projectName === "." ? "kilat-app" : projectName,
                    version: "1.0.0",
                    type: "module",
                    scripts: {
                        "dev": "kilat dev",
                        "build": "kilat build",
                        "serve": "kilat serve"
                    },
                    dependencies: {
                        "kilatjs": "latest",
                        "react": "^18.2.0",
                        "react-dom": "^18.2.0"
                    },
                    devDependencies: {
                        "@types/react": "^18.2.0",
                        "@types/react-dom": "^18.2.0",
                        "autoprefixer": "^10.4.0",
                        "postcss": "^8.4.0",
                        "tailwindcss": "^4.0.0",
                        "typescript": "^5.0.0"
                    }
                }, null, 2),

                "kilat.config.ts": `import { defineConfig } from "kilatjs";

export default defineConfig({
    appDir: ".",
    outDir: "./dist",
    port: 3000,
    clientRoute: "/client",
    publicDir: "./public",
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./public/styles.css",
    },
});
`,

                "input.css": `@import "tailwindcss";
`,

                "index.client.tsx": `import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
}
`,

                "App.tsx": `import React, { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-700 max-w-md w-full text-center">
        <h1 className="text-4xl font-bold text-white mb-6">
          KilatJS + React
        </h1>
        <p className="text-slate-400 mb-8">
          This is a React client-side application running inside KilatJS.
        </p>
        
        <div className="flex flex-col items-center gap-4">
          <div className="text-6xl font-mono font-bold mb-4">{count}</div>
          <div className="flex gap-4">
            <button onClick={() => setCount(c => c - 1)} className="px-6 py-2 bg-slate-700 rounded-lg">Decrease</button>
            <button onClick={() => setCount(c => c + 1)} className="px-6 py-2 bg-blue-600 rounded-lg">Increase</button>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-700">
          <a href="/" className="text-blue-400 hover:underline">Go to SSR Home</a>
        </div>
      </div>
    </div>
  );
}
`,

                "public/index.html": `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KilatJS App</title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/client/index.client.tsx"></script>
</body>
</html>
`,

                "routes/index.tsx": `import React from "react";

export const meta = {
    title: "Welcome to KilatJS",
    description: "My lightning fast KilatJS application",
};

export async function load() {
    return {
        message: "Hello from KilatJS!",
        time: new Date().toLocaleTimeString()
    };
}

export default function HomePage({ data }: { data: any }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl p-12 border border-gray-100">
                <h1 className="text-5xl font-black text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {data.message}
                </h1>
                <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                    Server simple time: <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">{data.time}</span>
                </p>
                <div className="flex gap-4">
                    <a href="/client" className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:scale-[1.02] transition-transform">
                        Try React Client
                    </a>
                </div>
            </div>
        </div>
    );
}
`,

                "routes/api/hello.ts": `import { RouteContext } from "kilatjs";

export async function GET(ctx: RouteContext) {
    return Response.json({
        message: "Hello from KilatJS API!",
        method: "GET"
    });
}

export async function POST(ctx: RouteContext) {
    const body = await ctx.request.json();
    return Response.json({
        message: "Hello from KilatJS API!",
        method: "POST",
        received: body
    });
}
`,
                "components/Layout.tsx": `import React from "react";

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white">
            <main>{children}</main>
        </div>
    );
}
`
            };

            for (const [filename, content] of Object.entries(files)) {
                await Bun.write(`${targetDir}/${filename}`, content);
                console.log(`   ✓ ${filename}`);
            }

            console.log(`\n✅ Project successfully created!`);
            console.log(`\nTo get started:`);
            if (projectName !== ".") console.log(`   cd ${projectName}`);
            console.log(`   bun install`);
            console.log(`   bun run dev\n`);
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
