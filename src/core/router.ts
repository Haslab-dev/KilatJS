import { RouteMatch, RouteContext, ServerGlobalState, KilatConfig, UIFramework, RouteMeta, RouteType, RouteExports } from "./types";
import { ReactAdapter } from "../adapters/react";
import { HTMXAdapter } from "../adapters/htmx";

export class Router {
    private routes: Map<string, any> = new Map();
    private config: KilatConfig;
    private staticPaths: Map<string, string[]> = new Map(); // Route -> paths for static generation
    private serverId = Date.now().toString();
    private fsRouter: Bun.FileSystemRouter;
    
    // High-performance route cache
    private routeCache: Map<string, RouteMatch | null> = new Map();
    private preloadedRoutes: Map<string, any> = new Map();
    private routePatterns: Array<{ pattern: RegExp; filePath: string; paramNames: string[]; routeType: RouteType }> = [];
    
    // Ultra-fast API route lookup table
    private apiRoutes: Map<string, any> = new Map();
    private staticApiResponses: Map<string, Response> = new Map();
    
    // Pre-compiled common responses
    private static readonly NOT_FOUND_RESPONSE = new Response("404 Not Found", { status: 404 });
    private static readonly METHOD_NOT_ALLOWED_RESPONSE = new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
    );
    private static readonly INTERNAL_ERROR_RESPONSE = new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
    );
    
    // Object pool for contexts to reduce allocations
    private contextPool: RouteContext[] = [];
    private poolIndex = 0;

    constructor(config: KilatConfig) {
        this.config = config;
        // Initialize Bun's FileSystemRouter
        // Use absolute path or resolve relative to current working directory
        const routesDir = config.routesDir.startsWith('/') 
            ? config.routesDir 
            : `${process.cwd()}/${config.routesDir}`;
            
        this.fsRouter = new Bun.FileSystemRouter({
            dir: routesDir,
            style: "nextjs",
            origin: `http://${config.hostname || "localhost"}:${config.port || 3000}`,
        });
    }

    getRoutes(): Map<string, any> {
        return this.routes;
    }

    getStaticPaths(): Map<string, string[]> {
        return this.staticPaths;
    }

    async loadRoutes() {
        // Reload the FileSystemRouter to pick up new files in dev mode
        if (this.config.dev) {
            this.fsRouter.reload();
            // Clear caches in dev mode
            this.routeCache.clear();
            this.preloadedRoutes.clear();
            this.routePatterns.length = 0;
        }

        // Pre-load all routes for maximum performance
        await this.preloadAllRoutes();
        
        console.log("🔄 FileSystemRouter initialized with", this.preloadedRoutes.size, "preloaded routes");
        if (this.config.dev) {
            console.log("📋 Preloaded routes:");
            for (const [route, exports] of this.preloadedRoutes.entries()) {
                console.log(`   ${route} (${route.includes('[') ? 'dynamic' : 'static'})`);
            }
            console.log("📋 Dynamic route patterns:", this.routePatterns.length);
            for (const pattern of this.routePatterns) {
                console.log(`   ${pattern.pattern} -> ${pattern.filePath}`);
            }
        }
    }

    private async preloadAllRoutes() {
        const routesDir = this.config.routesDir.startsWith('/') 
            ? this.config.routesDir 
            : `${process.cwd()}/${this.config.routesDir}`;

        await this.scanAndPreloadRoutes(routesDir, '');
    }

    private async scanAndPreloadRoutes(dir: string, basePath: string) {
        try {
            const proc = Bun.spawn(['find', dir, '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx'], {
                stdout: 'pipe',
            });
            
            const output = await new Response(proc.stdout).text();
            const files = output.trim().split('\n').filter(Boolean);
            
            for (const filePath of files) {
                const relativePath = filePath.replace(dir, '');
                let routePath = relativePath.replace(/\.(tsx?|jsx?)$/, '');
                
                // Convert file path to route path
                if (routePath.endsWith('/index')) {
                    routePath = routePath.slice(0, -6) || '/';
                }
                
                if (!routePath.startsWith('/')) {
                    routePath = '/' + routePath;
                }
                
                // Determine route type
                const routeType = this.getRouteType(routePath);
                
                try {
                    // Pre-import the route module
                    const routeExports = await import(filePath);
                    this.preloadedRoutes.set(routePath, routeExports);
                    
                    // Special handling for API routes - create fast lookup
                    if (routeType === "api") {
                        this.apiRoutes.set(routePath, routeExports);
                    }
                    
                    // Handle dynamic routes
                    if (routePath.includes('[')) {
                        const pattern = this.createRoutePattern(routePath);
                        if (pattern) {
                            this.routePatterns.push({
                                pattern: pattern.regex,
                                filePath,
                                paramNames: pattern.paramNames,
                                routeType
                            });
                        }
                    }
                } catch (error) {
                    console.warn(`Failed to preload route ${filePath}:`, error);
                }
            }
        } catch (error) {
            console.warn('Failed to scan routes:', error);
        }
    }

    private createRoutePattern(routePath: string): { regex: RegExp; paramNames: string[] } | null {
        const paramNames: string[] = [];
        
        // First escape special regex characters in the route path
        let pattern = routePath.replace(/[.*+?^${}|\\]/g, '\\$&');
        
        // Then convert [param] to regex groups and collect param names
        pattern = pattern.replace(/\\?\[([^\]]+)\\?\]/g, (match, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        
        try {
            const regex = new RegExp(`^${pattern}$`);
            console.log(`Created pattern for ${routePath}: ${regex} (params: ${paramNames.join(', ')})`);
            return {
                regex,
                paramNames
            };
        } catch (error) {
            console.warn(`Failed to create pattern for ${routePath}:`, error);
            return null;
        }
    }

    private getRouteType(pathname: string): RouteType {
        if (pathname.startsWith("/api")) {
            return "api";
        }
        // Check if route has dynamic segments (Bun's FileSystemRouter handles this)
        if (pathname.includes("[") || pathname.includes(":")) {
            return "dynamic";
        }
        return "static";
    }

    matchRoute(path: string): RouteMatch | null {
        // Check cache first for maximum performance
        if (this.routeCache.has(path)) {
            return this.routeCache.get(path)!;
        }

        let match: RouteMatch | null = null;

        // 1. Try exact match from preloaded routes (fastest path)
        if (this.preloadedRoutes.has(path)) {
            match = {
                route: path,
                params: {},
                exports: this.preloadedRoutes.get(path)!,
                routeType: this.getRouteType(path),
            };
        }
        
        // 2. Try dynamic route patterns
        if (!match) {
            for (const routePattern of this.routePatterns) {
                const regexMatch = path.match(routePattern.pattern);
                if (regexMatch) {
                    const params: Record<string, string> = {};
                    routePattern.paramNames.forEach((name, index) => {
                        params[name] = regexMatch[index + 1];
                    });
                    
                    // Convert file path back to route path to find the preloaded exports
                    const routesDir = this.config.routesDir.startsWith('/') 
                        ? this.config.routesDir 
                        : `${process.cwd()}/${this.config.routesDir}`;
                    
                    let routePath = routePattern.filePath.replace(routesDir, '').replace(/\.(tsx?|jsx?)$/, '');
                    if (!routePath.startsWith('/')) {
                        routePath = '/' + routePath;
                    }
                    
                    // Find the route exports by the original route path pattern
                    const exports = this.preloadedRoutes.get(routePath);
                    if (exports) {
                        match = {
                            route: path,
                            params,
                            exports,
                            routeType: routePattern.routeType,
                        };
                        break;
                    }
                }
            }
        }

        // Cache the result (including null for 404s)
        this.routeCache.set(path, match);
        return match;
    }

    private pathMatchesPattern(pattern: string, path: string): boolean {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);
        
        if (patternParts.length !== pathParts.length) {
            return false;
        }
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (!patternPart.startsWith('[') && patternPart !== pathPart) {
                return false;
            }
        }
        
        return true;
    }

    async handleRequest(request: Request): Promise<Response> {
        // Ultra-fast path extraction without URL parsing for simple cases
        const url = request.url;
        const pathStart = url.indexOf('/', 8); // Skip "http://" or "https://"
        const pathEnd = url.indexOf('?', pathStart);
        const path = pathEnd === -1 ? url.slice(pathStart) : url.slice(pathStart, pathEnd);

        // ULTRA-FAST API ROUTE PATH - Skip all other checks for /api routes
        if (path.startsWith('/api/')) {
            return this.handleApiRouteFast(request, path);
        }

        // Handle static file requests (CSS, favicon, ping) - only for non-API
        if (path.endsWith('.css') || path === '/favicon.ico' || path === '/_kilat/live-reload') {
            const staticResponse = await this.handleStaticFile(path);
            if (staticResponse) {
                return staticResponse;
            }
        }

        // HYBRID MODE (Production Only): Static files
        if (!this.config.dev) {
            const outDir = this.config.outDir || "./dist";
            const filePath = `${outDir}${path === '/' ? '/index.html' : path}`;
            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }

            if (!path.endsWith('.html')) {
                const indexFile = Bun.file(`${filePath}/index.html`);
                if (await indexFile.exists()) {
                    return new Response(indexFile);
                }
            }
        }

        // Standard Routing (SSR) - now synchronous and cached
        const match = this.matchRoute(path);
        if (!match) {
            return Router.NOT_FOUND_RESPONSE;
        }

        const { params, exports, routeType } = match;

        // Get context from pool to reduce allocations
        const context = this.getContextFromPool(request, params, url);

        // Handle HTTP actions (POST, PUT, DELETE, etc.) for page routes
        if (request.method !== "GET" && request.method !== "HEAD") {
            const actionHandler = exports[request.method as keyof Omit<RouteExports, 'default' | 'mode' | 'ui' | 'load' | 'meta' | 'getStaticPaths'>];
            if (actionHandler && typeof actionHandler === "function") {
                try {
                    const result = await actionHandler(context);
                    this.returnContextToPool(context);
                    return result;
                } catch (error) {
                    this.returnContextToPool(context);
                    console.error(`Error handling ${request.method}:`, error);
                    return Router.INTERNAL_ERROR_RESPONSE;
                }
            }
            this.returnContextToPool(context);
            return Router.METHOD_NOT_ALLOWED_RESPONSE;
        }

        // Handle GET requests - SSR for dynamic routes, cached for static
        try {
            const data = exports.load ? await exports.load(context) : {};

            // Handle loader throwing Response (e.g., 404)
            if (data instanceof Response) {
                this.returnContextToPool(context);
                return data;
            }

            // Get meta from loader result or static export
            const meta: RouteMeta = exports.meta || {};

            // Render the page
            const html = await this.renderPage(exports.default, { data, params, state: context.state }, exports.ui, meta);

            // Dynamic routes: no-cache (SSR on every request)
            // Static routes: can be cached
            const cacheControl = routeType === "dynamic" ? "no-cache" : "public, max-age=3600";

            this.returnContextToPool(context);
            return new Response(html, {
                headers: {
                    "Content-Type": "text/html; charset=utf-8",
                    "Cache-Control": cacheControl,
                },
            });
        } catch (error) {
            this.returnContextToPool(context);
            if (error instanceof Response) {
                return error;
            }
            console.error("Error rendering page:", error);
            return Router.INTERNAL_ERROR_RESPONSE;
        }
    }

    // Ultra-fast API route handler - bypasses most framework overhead
    private async handleApiRouteFast(request: Request, path: string): Promise<Response> {
        // First try direct lookup in API routes map
        let exports = this.apiRoutes.get(path);
        let params: Record<string, string> = {};
        
        // If no direct match, try dynamic API routes
        if (!exports) {
            for (const routePattern of this.routePatterns) {
                if (routePattern.routeType === "api") {
                    const regexMatch = path.match(routePattern.pattern);
                    if (regexMatch) {
                        routePattern.paramNames.forEach((name, index) => {
                            params[name] = regexMatch[index + 1];
                        });
                        
                        // Find the matching preloaded route
                        for (const [preloadedPath, preloadedExports] of this.preloadedRoutes.entries()) {
                            if (preloadedPath.includes('[') && preloadedPath.startsWith('/api/') && this.pathMatchesPattern(preloadedPath, path)) {
                                exports = preloadedExports;
                                break;
                            }
                        }
                        
                        if (exports) break;
                    }
                }
            }
        }
        
        if (!exports) {
            return Router.NOT_FOUND_RESPONSE;
        }

        const method = request.method;
        const handler = exports[method] || exports.default;

        if (!handler || typeof handler !== "function") {
            return Router.METHOD_NOT_ALLOWED_RESPONSE;
        }

        try {
            // Minimal context creation for API routes
            const context = this.getMinimalApiContext(request, path, params);
            const response = await handler(context);
            
            // If handler returns a Response, use it directly
            if (response instanceof Response) {
                return response;
            }

            // Fast JSON response creation
            return new Response(JSON.stringify(response), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error(`API Error [${method} ${path}]:`, error);
            return Router.INTERNAL_ERROR_RESPONSE;
        }
    }

    // Object pool management for reduced allocations
    private getContextFromPool(request: Request, params: Record<string, string>, url: string): RouteContext {
        if (this.contextPool.length > 0) {
            const context = this.contextPool.pop()!;
            context.request = request;
            context.params = params;
            context.query = new URLSearchParams(url.split('?')[1] || '');
            context.state = {};
            return context;
        }

        return {
            request,
            params,
            query: new URLSearchParams(url.split('?')[1] || ''),
            state: {},
        };
    }

    private returnContextToPool(context: RouteContext): void {
        if (this.contextPool.length < 100) { // Limit pool size
            this.contextPool.push(context);
        }
    }

    private getMinimalApiContext(request: Request, path: string, params: Record<string, string> = {}): RouteContext {
        return {
            request,
            params,
            query: new URLSearchParams(request.url.split('?')[1] || ''),
            state: {},
        };
    }



    private async handleStaticFile(path: string): Promise<Response | null> {
        // Handle CSS files
        if (path.endsWith(".css")) {
            const cssPath = this.config.tailwind?.cssPath || "./styles.css";
            try {
                const cssFile = Bun.file(cssPath);
                if (await cssFile.exists()) {
                    return new Response(cssFile, {
                        headers: {
                            "Content-Type": "text/css",
                            "Cache-Control": "public, max-age=3600",
                        },
                    });
                }
            } catch (error) {
                // File not found, continue
            }
        }

        // Handle favicon
        if (path === "/favicon.ico") {
            return new Response(null, { status: 204 });
        }

        // Handle internal live-reload via SSE
        if (path === "/_kilat/live-reload") {
            const serverId = this.serverId;
            return new Response(
                new ReadableStream({
                    start(controller) {
                        // Send server ID immediately
                        controller.enqueue(`data: ${serverId}\n\n`);
                        // Keep open - no controller.close()
                    },
                }),
                {
                    headers: {
                        "Content-Type": "text/event-stream",
                        "Cache-Control": "no-cache",
                        "Connection": "keep-alive",
                    },
                }
            );
        }

        return null;
    }

    private create404Response(): Response {
        const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>404 - Page Not Found</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="/styles.css" />
  </head>
  <body>
    <div id="root">
      <div class="container">
        <h1>404 - Page Not Found</h1>
        <p>The page you're looking for doesn't exist.</p>
        <a href="/">Go back home</a>
      </div>
    </div>
  </body>
</html>`;
        return new Response(html, {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" },
        });
    }

    private async renderPage(
        PageComponent: any,
        props: { data: any; params: Record<string, string>; state: ServerGlobalState },
        uiFramework: UIFramework = "react",
        meta: RouteMeta = {}
    ): Promise<string> {
        switch (uiFramework) {
            case "react":
                const reactContent = await ReactAdapter.renderToString(PageComponent, props);
                return ReactAdapter.createDocument(reactContent, meta, this.config);

            case "htmx":
                const htmxContent = await HTMXAdapter.renderToString(PageComponent, props);
                return HTMXAdapter.createDocument(htmxContent, meta, this.config);
            default:
                throw new Error(`Unsupported UI framework: ${uiFramework}`);
        }
    }
}