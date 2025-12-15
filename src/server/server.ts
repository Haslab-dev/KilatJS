import { Router } from "../core/router";
import { KilatConfig } from "../core/types";

export class KilatServer {
    private router: Router;
    private config: KilatConfig;

    constructor(config: KilatConfig) {
        this.config = config;
        this.router = new Router(config);
    }

    async start() {
        // Run Tailwind: Build first to ensure file exists
        if (this.config.tailwind?.enabled) {
            console.log("🎨 Building Tailwind CSS...");
            await this.runTailwind(false);

            // Then start watcher in dev mode
            if (this.config.dev) {
                this.runTailwind(true);
            }
        }

        // Load all routes
        await this.router.loadRoutes();

        const router = this.router;
        const config = this.config;

        // Start the server
        const server = Bun.serve({
            port: config.port || 3000,
            hostname: config.hostname || "localhost",
            async fetch(request: Request) {
                return router.handleRequest(request);
            },
        });

        console.log(`
🚀 KilatJS Server Running!
━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Local:   http://${server.hostname}:${server.port}
   Mode:    ${config.dev ? "Development" : "Production"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);

        if (config.dev) {
            console.log("📁 Using FileSystemRouter for dynamic route discovery");
            console.log("");
        }

        return server;
    }

    async buildStatic() {
        // Run Tailwind in build mode if enabled
        if (this.config.tailwind?.enabled) {
            await this.runTailwind(false);
        }

        // Load all routes
        await this.router.loadRoutes();

        console.log("🔨 Building for hybrid deployment...\n");

        // Create output directory if it doesn't exist
        await this.ensureDir(this.config.outDir);

        console.log("📄 Static build with FileSystemRouter:");
        console.log("─────────────────────────────────────");
        console.log("   Using Bun's built-in FileSystemRouter for dynamic routing");
        console.log("   Static assets will be copied to output directory");

        // Copy static assets
        await this.copyStaticAssets();

        // Generate production server that uses FileSystemRouter
        await this.generateProductionServer();

        console.log(`
✅ Hybrid Build Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Using Bun FileSystemRouter for all routes
   Output: ${import.meta.dir}/../${this.config.outDir}
   
   Run 'bun dist/server.js' to start the server.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    }

    /**
     * Generate a production server file that uses Bun's FileSystemRouter
     */
    private async generateProductionServer() {
        console.log("\n⚙️  Generating production server with FileSystemRouter...");

        // Copy entire src directory to preserve imports and structure
        const srcDir = this.config.routesDir.replace('/routes', '');
        const srcOutDir = `${this.config.outDir}/src`;
        await this.copyDir(srcDir, srcOutDir);
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
        
        console.log(\`Route matched: \${path} -> \${match.filePath}\`);
        
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



    private formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private async runTailwind(watch: boolean) {
        const { inputPath, cssPath } = this.config.tailwind || {};
        if (!inputPath || !cssPath) {
            console.warn("⚠️ Tailwind enabled but inputPath or cssPath missing");
            return;
        }

        // Resolve paths relative to current working directory
        const resolvedInputPath = inputPath.startsWith('/') ? inputPath : `${process.cwd()}/${inputPath}`;
        const resolvedCssPath = cssPath.startsWith('/') ? cssPath : `${process.cwd()}/${cssPath}`;

        const args = ["bunx", "@tailwindcss/cli", "-i", resolvedInputPath, "-o", resolvedCssPath];
        if (watch) {
            args.push("--watch");
        }

        console.log(`🎨 ${watch ? "Watching" : "Building"} Tailwind CSS...`);
        
        try {
            const proc = Bun.spawn(args, {
                stdout: "inherit",
                stderr: "inherit",
                cwd: process.cwd(),
            });

            if (!watch) {
                await proc.exited;
            }
        } catch (error) {
            console.error("Failed to run Tailwind:", error);
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
    }

    private async copyDir(src: string, dest: string) {
        // Use Bun's file operations for copying directories
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