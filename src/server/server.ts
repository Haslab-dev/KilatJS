import { Router } from "../core/router";
import { KilatConfig } from "../core/types";
import { dirname } from "path";
import { startLiveReload, notifyReload, watchDirectory } from "./live-reload";

export class KilatServer {
    private router: Router;
    private config: KilatConfig;
    
    // Resolved paths
    private appDir: string;
    private routesDir: string;

    constructor(config: KilatConfig) {
        this.config = config;
        
        // Resolve appDir and routesDir
        const { appDir, routesDir } = this.resolvePaths(config);
        this.appDir = appDir;
        this.routesDir = routesDir;
        
        // Create config for router with resolved routesDir and absolute appDir
        this.router = new Router({ ...config, appDir: this.appDir, routesDir: this.routesDir });
    }
    
    /**
     * Resolve appDir and routesDir from config
     * Auto-detects routes/ or pages/ folder inside appDir
     */
    private resolvePaths(config: KilatConfig): { appDir: string; routesDir: string } {
        const cwd = process.cwd();
        
        const appDir = config.appDir.startsWith('/') 
            ? config.appDir 
            : `${cwd}/${config.appDir}`;
        
        // Check for routes/ or pages/ folder
        const routesPath = `${appDir}/routes`;
        const pagesPath = `${appDir}/pages`;
        
        // Sync check using spawnSync for constructor
        const checkRoutes = Bun.spawnSync(["test", "-d", routesPath]);
        if (checkRoutes.exitCode === 0) {
            return { appDir, routesDir: routesPath };
        }
        
        const checkPages = Bun.spawnSync(["test", "-d", pagesPath]);
        if (checkPages.exitCode === 0) {
            return { appDir, routesDir: pagesPath };
        }
        
        // Default to routes if neither exists
        console.warn(`⚠️ No routes/ or pages/ folder found in ${appDir}, defaulting to routes/`);
        return { appDir, routesDir: routesPath };
    }

    async start() {
        const config = this.config;
        const router = this.router;

        // Run Tailwind build (silent in dev mode)
        if (config.tailwind?.enabled) {
            await this.runTailwind(false, config.dev);
            if (config.dev) {
                this.runTailwind(true, true); // Start watcher silently
            }
        }

        // Load all routes (silent in dev mode)
        await router.loadRoutes(config.dev);

        // Build the routes object for Bun.serve()
        const routes: Record<string, any> = {};
        
        // Add static file routes
        const cssPath = config.tailwind?.cssPath || "./styles.css";
        routes["/styles.css"] = async () => {
            const file = Bun.file(cssPath);
            if (await file.exists()) {
                return new Response(file, {
                    headers: { "Content-Type": "text/css" }
                });
            }
            return new Response("", { headers: { "Content-Type": "text/css" } });
        };

        // Handle clientRoute and auto-detecting index.html
        const clientRouteBase = config.clientRoute || "/";
        const ssrRoot = config.ssrRoot ?? true;
        
        // Auto-detect index.html
        let indexPath = "";
        const possibleIndexPaths = ["public/index.html", "index.html"];
        for (const p of possibleIndexPaths) {
            const fullPath = `${process.cwd()}/${p}`;
            if (Bun.spawnSync(["test", "-f", fullPath]).exitCode === 0) {
                indexPath = fullPath;
                break;
            }
        }

        // If we want client to be root or if client is on a specific subpath
        if (indexPath && (!ssrRoot || clientRouteBase !== "/")) {
            const handler = async () => {
                const file = Bun.file(indexPath);
                if (config.dev) {
                    let html = await file.text();
                    const { getLiveReloadScript } = await import("./live-reload");
                    html = html.replace("</body>", `${getLiveReloadScript()}</body>`);
                    return new Response(html, {
                        headers: { "Content-Type": "text/html" }
                    });
                }
                return new Response(file, {
                    headers: { "Content-Type": "text/html" }
                });
            };
            
            routes[clientRouteBase] = handler;
            if (clientRouteBase !== "/" && !clientRouteBase.endsWith("/")) {
                routes[clientRouteBase + "/"] = handler;
            }
        }

        // Handle clientEntry (auto-detect index.client.tsx if not provided)
        let clientEntry = config.clientEntry;
        if (!clientEntry) {
            const defaultEntry = "index.client.tsx";
            if (Bun.spawnSync(["test", "-f", `${process.cwd()}/${defaultEntry}`]).exitCode === 0) {
                clientEntry = defaultEntry;
            }
        }

        if (clientEntry) {
            // Update config to reflect detected entry (useful for router)
            (config as any).clientEntry = clientEntry;
            
            // In dev mode, we use a reference that can be updated by the watcher
            let clientJs: any = await this.bundleClient();

            const base = clientRouteBase === "/" ? "" : clientRouteBase;
            const clientName = clientEntry.replace(/\.(tsx?|jsx?)$/, '.js');
            const clientRoute = `${base}/${clientName}`;
            const originalRoute = `${base}/${clientEntry}`;
            
            const handler = async () => {
                return new Response(clientJs, {
                    headers: { "Content-Type": "application/javascript" }
                });
            };
            
            routes[clientRoute] = handler;
            routes[originalRoute] = handler;
            
            console.log(`   ✓ Client served at ${clientRoute}`);

            // If in dev mode, watch for client changes
            if (config.dev) {
                const clientEntryPath = clientEntry.startsWith('/') ? clientEntry : `${process.cwd()}/${clientEntry}`;
                const clientDir = dirname(clientEntryPath);
                
                watchDirectory(clientDir, async (filename) => {
                    console.log(`📦 Re-bundling client: ${clientEntry}...`);
                    clientJs = await this.bundleClient();
                    notifyReload(filename);
                });
            }
        }

        // Use Bun.serve with development mode for HMR
        const server = Bun.serve({
            port: config.port || 3000,
            hostname: config.hostname || "localhost",
            
            // Enable Bun's native development features including HMR
            development: config.dev ? {
                hmr: true,
                console: true,
            } : false,

            // Static routes
            routes,

            // Dynamic request handler
            async fetch(request: Request) {
                return router.handleRequest(request);
            },
        });

        if (config.dev) {
            // Clean dev output
            console.log(`
⚡ KilatJS Dev Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ➜ http://${server.hostname}:${server.port}
  ➜ HMR + Live Reload enabled
  ➜ Edit files and see changes instantly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

            // Start live reload server (silent)
            startLiveReload();

            // Watch for file changes and notify browser
            watchDirectory(this.routesDir, async (filename) => {
                await router.loadRoutes(true);
                notifyReload(filename);
            });

            // Also watch components directory if it exists
            const componentsDir = `${this.appDir}/components`;
            const checkComponents = Bun.spawnSync(["test", "-d", componentsDir]);
            if (checkComponents.exitCode === 0) {
                watchDirectory(componentsDir, async (filename) => {
                    await router.loadRoutes(true);
                    notifyReload(filename);
                });
            }

            // Watch for middleware.ts/js in appDir
            watchDirectory(this.appDir, async (filename) => {
                if (filename === "middleware.ts" || filename === "middleware.js" || filename === "kilat.config.ts") {
                    await router.loadRoutes(true);
                    notifyReload(filename);
                }
            });
        } else {
            // Production output with route details
            console.log(`
🚀 KilatJS Production Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ➜ http://${server.hostname}:${server.port}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
        }

        return server;
    }

    async buildStatic() {
        console.log("\n🔨 KilatJS Production Build\n");

        // Run Tailwind in build mode if enabled (message is inside runTailwind)
        if (this.config.tailwind?.enabled) {
            await this.runTailwind(false, false);
        }

        // Load all routes
        await this.router.loadRoutes(true);

        // Create output directory if it doesn't exist
        await this.ensureDir(this.config.outDir);

        // Analyze and display routes
        await this.displayRouteAnalysis();

        // Bundle client entry if provided
        if (this.config.clientEntry) {
            await this.bundleClient();
        }

        // Copy static assets
        await this.copyStaticAssets();

        // Generate production server that uses FileSystemRouter
        await this.generateProductionServer();

        console.log(`
✅ Build Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Output: ${this.config.outDir}
   
   Start: bun ${this.config.outDir}/server.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    }

    /**
     * Analyze routes and display detailed information
     */
    private async displayRouteAnalysis() {
        console.log("📄 Routes Analysis:");
        console.log("─────────────────────────────────────────────────────────");
        
        const routes: Array<{ path: string; type: string; file: string }> = [];
        
        // Scan all route files
        try {
            const proc = Bun.spawn(['find', this.routesDir, '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx'], {
                stdout: 'pipe',
            });
            
            const output = await new Response(proc.stdout).text();
            const files = output.trim().split('\n').filter(Boolean);
            
            for (const filePath of files) {
                const relativePath = filePath.replace(this.routesDir, '');
                let routePath = relativePath.replace(/\.(tsx?|jsx?)$/, '');
                
                if (routePath.endsWith('/index')) {
                    routePath = routePath.slice(0, -6) || '/';
                }
                
                if (!routePath.startsWith('/')) {
                    routePath = '/' + routePath;
                }
                
                // Determine route type
                let type: string;
                if (routePath.startsWith('/api')) {
                    type = 'API';
                } else if (routePath.includes('[')) {
                    type = 'Dynamic SSR';
                } else {
                    type = 'SSR';
                }
                
                const shortFile = relativePath.replace(/^\//, '');
                routes.push({ path: routePath, type, file: shortFile });
            }
        } catch (error) {
            console.warn('Failed to analyze routes:', error);
        }

        // Sort routes
        routes.sort((a, b) => a.path.localeCompare(b.path));

        // Display routes in a table format
        const maxPathLen = Math.max(...routes.map(r => r.path.length), 10);
        const maxTypeLen = Math.max(...routes.map(r => r.type.length), 6);

        for (const route of routes) {
            const typeIcon = route.type === 'API' ? '⚡' : route.type === 'Dynamic SSR' ? '🔄' : '📄';
            const paddedPath = route.path.padEnd(maxPathLen);
            const paddedType = route.type.padEnd(maxTypeLen);
            console.log(`   ${typeIcon} ${paddedPath}  ${paddedType}  ${route.file}`);
        }

        console.log("─────────────────────────────────────────────────────────");
        
        // Summary
        const apiCount = routes.filter(r => r.type === 'API').length;
        const dynamicCount = routes.filter(r => r.type === 'Dynamic SSR').length;
        const ssrCount = routes.filter(r => r.type === 'SSR').length;
        
        console.log(`   Total: ${routes.length} routes (${ssrCount} SSR, ${dynamicCount} Dynamic, ${apiCount} API)\n`);
    }

    /**
     * Generate a production server file that uses Bun's FileSystemRouter
     */
    private async generateProductionServer() {
        console.log("\n⚙️  Generating production server with FileSystemRouter...");

        // Copy entire src directory to preserve imports and structure
        const srcOutDir = `${this.config.outDir}/src`;
        await this.copyDir(this.appDir, srcOutDir);
        console.log(`   ✓ src/ (copied with all components and routes)`);

        // Generate the production server using FileSystemRouter
        const serverCode = `#!/usr/bin/env bun
/**
 * KilatJS Production Server with FileSystemRouter
 * Generated at: ${new Date().toISOString()}
 * 
 * Uses Bun's built-in FileSystemRouter for optimal performance
 */

const PORT = process.env.PORT || ${this.config.port || 3000};
const HOST = process.env.HOST || "${this.config.hostname || "localhost"}";
const ROOT = import.meta.dir;

// Initialize FileSystemRouter
const fsRouter = new Bun.FileSystemRouter({
    dir: ROOT + "/src/routes",
    style: "nextjs",
    origin: \`http://\${HOST}:\${PORT}\`,
});

function getRouteType(pathname) {
    if (pathname.startsWith("/api")) return "api";
    if (pathname.includes("[") || pathname.includes(":")) return "dynamic";
    return "static";
}

// React SSR support
let React, ReactDOMServer;
try {
    React = await import("react");
    ReactDOMServer = await import("react-dom/server");
} catch (e) {
    console.warn("React not available for SSR");
}

async function renderPage(Component, props, meta = {}) {
    if (!ReactDOMServer || !React) {
        return "<html><body>React not available for SSR</body></html>";
    }
    
    const content = ReactDOMServer.renderToString(React.createElement(Component, props));
    return \`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>\${meta.title || "KilatJS App"}</title>
    \${meta.description ? \`<meta name="description" content="\${meta.description}" />\` : ""}
    <link rel="stylesheet" href="/styles.css" />
</head>
<body>
    <div id="root">\${content}</div>
</body>
</html>\`;
}

console.log(\`
🚀 KilatJS Production Server (FileSystemRouter)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   http://\${HOST}:\${PORT}
   Using Bun FileSystemRouter for optimal performance
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
\`);

Bun.serve({
    port: PORT,
    hostname: HOST,
    async fetch(req) {
        const url = new URL(req.url);
        const path = url.pathname;
        
        // 1. Try static files first
        const staticFile = Bun.file(ROOT + (path === "/" ? "/index.html" : path));
        if (await staticFile.exists()) {
            return new Response(staticFile);
        }
        
        // 2. Try index.html for directories
        const indexFile = Bun.file(ROOT + path + "/index.html");
        if (await indexFile.exists()) {
            return new Response(indexFile);
        }
        
        // 3. Use FileSystemRouter for dynamic routes
        const match = fsRouter.match(path);
        if (!match) {
            console.log(\`No route match found for: \${path}\`);
            return new Response("404 Not Found", { status: 404 });
        }
        
        // Use relative path for cleaner logs
        const relativePath = match.filePath.replace(ROOT + "/", "");
        console.log(\`Route matched: \${path} -> \${relativePath}\`);
        
        try {
            // Dynamically import the route
            const routeExports = await import(match.filePath);
            const routeType = getRouteType(match.pathname);
            const params = match.params || {};
            const ctx = { 
                request: req, 
                params, 
                query: url.searchParams, 
                state: {} 
            };
            
            // API routes
            if (routeType === "api") {
                const handler = routeExports[req.method] || routeExports.default;
                if (!handler) {
                    return new Response(JSON.stringify({ error: "Method Not Allowed" }), {
                        status: 405,
                        headers: { "Content-Type": "application/json" }
                    });
                }
                
                const result = await handler(ctx);
                if (result instanceof Response) return result;
                
                return new Response(JSON.stringify(result), {
                    headers: { "Content-Type": "application/json" }
                });
            }
            
            // Page routes - handle HTTP methods
            if (req.method !== "GET" && req.method !== "HEAD") {
                const handler = routeExports[req.method];
                if (handler) return await handler(ctx);
                return new Response("Method Not Allowed", { status: 405 });
            }
            
            // GET requests - SSR
            const data = routeExports.load ? await routeExports.load(ctx) : {};
            if (data instanceof Response) return data;
            
            const html = await renderPage(
                routeExports.default, 
                { data, params, state: {} }, 
                routeExports.meta || {}
            );
            
            const cacheControl = routeType === "dynamic" ? "no-cache" : "public, max-age=3600";
            
            return new Response(html, {
                headers: { 
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": cacheControl
                }
            });
            
        } catch (error) {
            if (error instanceof Response) return error;
            console.error("Route error:", error);
            return new Response("Internal Server Error", { status: 500 });
        }
    }
});
`;

        // Write the server file
        const serverPath = `${this.config.outDir}/server.js`;
        await Bun.write(serverPath, serverCode);
        console.log(`   ✓ server.js (FileSystemRouter-based)`);
    }

    private async runTailwind(watch: boolean, silent: boolean = false) {
        const { inputPath, cssPath } = this.config.tailwind || {};
        if (!inputPath || !cssPath) {
            if (!silent) console.warn("⚠️ Tailwind enabled but inputPath or cssPath missing");
            return;
        }

        // Resolve paths relative to current working directory
        const resolvedInputPath = inputPath.startsWith('/') ? inputPath : `${process.cwd()}/${inputPath}`;
        const resolvedCssPath = cssPath.startsWith('/') ? cssPath : `${process.cwd()}/${cssPath}`;

        const args = ["bunx", "@tailwindcss/cli", "-i", resolvedInputPath, "-o", resolvedCssPath];
        if (watch) {
            args.push("--watch");
        }

        if (!silent) {
            console.log(`🎨 ${watch ? "Watching" : "Building"} Tailwind CSS...`);
        }
        
        try {
            const proc = Bun.spawn(args, {
                stdout: silent ? "pipe" : "inherit",
                stderr: silent ? "pipe" : "inherit",
                cwd: process.cwd(),
            });

            if (!watch) {
                await proc.exited;
            }
        } catch (error) {
            if (!silent) console.error("Failed to run Tailwind:", error);
        }
    }

    private async copyStaticAssets() {
        console.log("\n📦 Copying static assets...");

        // Copy CSS
        const cssPath = this.config.tailwind?.cssPath || "./styles.css";
        const cssFile = Bun.file(cssPath);

        if (await cssFile.exists()) {
            const outputCssPath = `${this.config.outDir}/styles.css`;
            await Bun.write(outputCssPath, cssFile);
            console.log(`   ✓ styles.css`);
        }

        // Copy public directory if it exists
        if (this.config.publicDir) {
            const publicFile = Bun.file(this.config.publicDir);
            if (await publicFile.exists()) {
                await this.copyDir(this.config.publicDir, this.config.outDir);
                console.log(`   ✓ public assets`);
            }
        }

        // Auto-detect and copy index.html
        const possibleIndexPaths = ["public/index.html", "index.html"];
        for (const p of possibleIndexPaths) {
            const indexFile = Bun.file(p);
            if (await indexFile.exists()) {
                await Bun.write(`${this.config.outDir}/index.html`, indexFile);
                console.log(`   ✓ index.html`);
                break;
            }
        }
    }

    private async bundleClient() {
        if (!this.config.clientEntry) return;

        const entryPath = this.config.clientEntry.startsWith('/') 
            ? this.config.clientEntry 
            : `${process.cwd()}/${this.config.clientEntry}`;
        
        const isDev = this.config.dev;
        
        console.log(`📦 Bundling client entry${!isDev ? ' for production' : ''}: ${this.config.clientEntry}...`);
        
        const bundle = await Bun.build({
            entrypoints: [entryPath],
            outdir: isDev ? undefined : this.config.outDir,
            naming: "[name].js",
            minify: !isDev,
            sourcemap: isDev ? "external" : "none",
            target: "browser",
        });

        if (bundle.success) {
            if (!isDev) {
                console.log(`   ✓ Client bundled to ${this.config.outDir}`);
            }
            return bundle.outputs[0];
        } else {
            console.error("❌ Client bundle failed:", bundle.logs);
            return null;
        }
    }

    private async copyDir(src: string, dest: string) {
        try {
            const proc = Bun.spawn(["cp", "-r", src, dest], {
                stdout: "pipe",
                stderr: "pipe",
            });
            await proc.exited;
        } catch (error) {
            console.warn(`Failed to copy ${src} to ${dest}:`, error);
        }
    }

    private async ensureDir(dir: string): Promise<void> {
        try {
            const proc = Bun.spawn(["mkdir", "-p", dir], {
                stdout: "pipe",
                stderr: "pipe",
            });
            await proc.exited;
        } catch (error) {
            console.warn(`Failed to create directory ${dir}:`, error);
        }
    }
}
