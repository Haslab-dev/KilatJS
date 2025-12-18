import { RouteMatch, RouteContext, ServerGlobalState, KilatConfig, UIFramework, RouteMeta, RouteType, RouteExports } from "./types";
import { ReactAdapter } from "../adapters/react";
import { HTMXAdapter } from "../adapters/htmx";

/** Internal config with resolved routesDir (set by KilatServer) */
interface InternalRouterConfig extends KilatConfig {
    routesDir: string;
}

export class Router {
    private routes: Map<string, any> = new Map();
    private config: InternalRouterConfig;
    private staticPaths: Map<string, string[]> = new Map();
    private fsRouter: Bun.FileSystemRouter;
    
    // Route cache (cleared on HMR)
    private routeCache: Map<string, RouteMatch | null> = new Map();
    private preloadedRoutes: Map<string, any> = new Map();
    private routePatterns: Array<{ pattern: RegExp; filePath: string; paramNames: string[]; routeType: RouteType }> = [];
    private apiRoutes: Map<string, any> = new Map();
    
    // Pre-compiled responses
    private static readonly NOT_FOUND_RESPONSE = new Response("404 Not Found", { status: 404 });
    private static readonly METHOD_NOT_ALLOWED_RESPONSE = new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
    );
    private static readonly INTERNAL_ERROR_RESPONSE = new Response(
        JSON.stringify({ error: "Internal Server Error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
    );
    
    // Context pool for reduced allocations
    private contextPool: RouteContext[] = [];

    constructor(config: InternalRouterConfig) {
        this.config = config;
        this.fsRouter = new Bun.FileSystemRouter({
            dir: config.routesDir,
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

    async loadRoutes(silent: boolean = false) {
        // Reload FileSystemRouter to pick up new files
        this.fsRouter.reload();
        
        // Clear caches
        this.routeCache.clear();
        this.preloadedRoutes.clear();
        this.routePatterns.length = 0;
        this.apiRoutes.clear();
        this.staticHtmlFiles.clear();

        // Pre-load all routes
        await this.preloadAllRoutes(silent);
        
        if (!silent) {
            console.log("🔄 FileSystemRouter initialized with", this.preloadedRoutes.size, "routes");
        }
    }

    private async preloadAllRoutes(silent: boolean = false) {
        await this.scanAndPreloadRoutes(this.config.routesDir, '', silent);
    }

    // Static HTML files map (route -> file path)
    private staticHtmlFiles: Map<string, string> = new Map();
    
    private async scanAndPreloadRoutes(dir: string, _basePath: string, _silent: boolean = false) {
        try {
            // Scan for TS/JS route files
            const proc = Bun.spawn(['find', dir, '-name', '*.ts', '-o', '-name', '*.tsx', '-o', '-name', '*.js', '-o', '-name', '*.jsx', '-o', '-name', '*.html'], {
                stdout: 'pipe',
            });
            
            const output = await new Response(proc.stdout).text();
            const files = output.trim().split('\n').filter(Boolean);
            
            for (const filePath of files) {
                const relativePath = filePath.replace(dir, '');
                const isHtml = filePath.endsWith('.html');
                
                let routePath = relativePath.replace(/\.(tsx?|jsx?|html)$/, '');
                
                if (routePath.endsWith('/index')) {
                    routePath = routePath.slice(0, -6) || '/';
                }
                
                if (!routePath.startsWith('/')) {
                    routePath = '/' + routePath;
                }
                
                // Handle static HTML files separately
                if (isHtml) {
                    this.staticHtmlFiles.set(routePath, filePath);
                    continue;
                }
                
                const routeType = this.getRouteType(routePath);
                
                try {
                    // Import the route module
                    // Bun's --hot flag handles cache invalidation automatically
                    const routeExports = await import(filePath);
                    this.preloadedRoutes.set(routePath, routeExports);
                    
                    if (routeType === "api") {
                        this.apiRoutes.set(routePath, routeExports);
                    }
                    
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
    
    /** Check if route is a static HTML file */
    getStaticHtmlFile(path: string): string | undefined {
        return this.staticHtmlFiles.get(path);
    }

    private createRoutePattern(routePath: string): { regex: RegExp; paramNames: string[] } | null {
        const paramNames: string[] = [];
        
        let pattern = routePath.replace(/[.*+?^${}|\\]/g, '\\$&');
        pattern = pattern.replace(/\\?\[([^\]]+)\\?\]/g, (_match, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        
        try {
            const regex = new RegExp(`^${pattern}$`);
            return { regex, paramNames };
        } catch (error) {
            console.warn(`Failed to create pattern for ${routePath}:`, error);
            return null;
        }
    }

    private getRouteType(pathname: string): RouteType {
        if (pathname.startsWith("/api")) return "api";
        if (pathname.includes("[") || pathname.includes(":")) return "dynamic";
        return "static";
    }

    matchRoute(path: string): RouteMatch | null {
        if (this.routeCache.has(path)) {
            return this.routeCache.get(path)!;
        }

        let match: RouteMatch | null = null;

        // Try exact match first
        if (this.preloadedRoutes.has(path)) {
            match = {
                route: path,
                params: {},
                exports: this.preloadedRoutes.get(path)!,
                routeType: this.getRouteType(path),
            };
        }
        
        // Try dynamic route patterns
        if (!match) {
            for (const routePattern of this.routePatterns) {
                const regexMatch = path.match(routePattern.pattern);
                if (regexMatch) {
                    const params: Record<string, string> = {};
                    routePattern.paramNames.forEach((name, index) => {
                        params[name] = regexMatch[index + 1];
                    });
                    
                    let routePath = routePattern.filePath.replace(this.config.routesDir, '').replace(/\.(tsx?|jsx?)$/, '');
                    if (!routePath.startsWith('/')) {
                        routePath = '/' + routePath;
                    }
                    
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

        this.routeCache.set(path, match);
        return match;
    }

    async handleRequest(request: Request): Promise<Response> {
        const url = request.url;
        const pathStart = url.indexOf('/', 8);
        const pathEnd = url.indexOf('?', pathStart);
        const path = pathEnd === -1 ? url.slice(pathStart) : url.slice(pathStart, pathEnd);

        // Fast path for API routes
        if (path.startsWith('/api/')) {
            return this.handleApiRouteFast(request, path);
        }

        // Handle static files
        if (path.endsWith('.css') || path === '/favicon.ico') {
            const staticResponse = await this.handleStaticFile(path);
            if (staticResponse) return staticResponse;
        }

        // Production: try static files
        if (!this.config.dev) {
            const outDir = this.config.outDir || "./dist";
            const filePath = `${outDir}${path === '/' ? '/index.html' : path}`;
            const file = Bun.file(filePath);
            if (await file.exists()) {
                return new Response(file);
            }
        }

        // Check for static HTML files
        const htmlFilePath = this.staticHtmlFiles.get(path);
        if (htmlFilePath) {
            const file = Bun.file(htmlFilePath);
            if (await file.exists()) {
                return new Response(file, {
                    headers: {
                        "Content-Type": "text/html; charset=utf-8",
                        "Cache-Control": this.config.dev ? "no-cache" : "public, max-age=3600",
                    },
                });
            }
        }

        // SSR routing
        const match = this.matchRoute(path);
        if (!match) {
            const clientRoute = this.config.clientRoute || "/";
            const ssrRoot = this.config.ssrRoot ?? true;

            // Fallback to index.html if:
            // 1. Path matches clientRoute (exact or as a directory)
            // 2. AND (ssrRoot is false OR path is not root OR clientRoute is not root)
            const isClientPath = path === clientRoute || path.startsWith(clientRoute + "/");
            const shouldFallback = isClientPath && (!ssrRoot || path !== "/" || clientRoute !== "/");

            if (shouldFallback) {
                const possibleIndexPaths = ["public/index.html", "index.html"];
                for (const p of possibleIndexPaths) {
                    const fullPath = `${process.cwd()}/${p}`;
                    const file = Bun.file(fullPath);
                    if (await file.exists()) {
                        return new Response(file, {
                            headers: { 
                                "Content-Type": "text/html",
                                "Cache-Control": "no-cache" 
                            }
                        });
                    }
                }
            }
            return Router.NOT_FOUND_RESPONSE;
        }

        const { params, exports, routeType } = match;
        const context = this.getContextFromPool(request, params, url);

        // Handle non-GET methods
        if (request.method !== "GET" && request.method !== "HEAD") {
            const actionHandler = exports[request.method as keyof Omit<RouteExports, 'default' | 'mode' | 'ui' | 'load' | 'meta' | 'getStaticPaths' | 'clientScript'>];
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

        // Handle GET - SSR
        try {
            const data = exports.load ? await exports.load(context) : {};

            if (data instanceof Response) {
                this.returnContextToPool(context);
                return data;
            }

            const meta: RouteMeta = exports.meta || {};
            const html = await this.renderPage(
                exports.default, 
                { data, params, state: context.state }, 
                exports.ui, 
                meta,
                { clientScript: exports.clientScript }
            );

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
            if (error instanceof Response) return error;
            console.error("Error rendering page:", error);
            return Router.INTERNAL_ERROR_RESPONSE;
        }
    }

    private async handleApiRouteFast(request: Request, path: string): Promise<Response> {
        let exports = this.apiRoutes.get(path);
        let params: Record<string, string> = {};
        
        if (!exports) {
            for (const routePattern of this.routePatterns) {
                if (routePattern.routeType === "api") {
                    const regexMatch = path.match(routePattern.pattern);
                    if (regexMatch) {
                        routePattern.paramNames.forEach((name, index) => {
                            params[name] = regexMatch[index + 1];
                        });
                        
                        for (const [preloadedPath, preloadedExports] of this.preloadedRoutes.entries()) {
                            if (preloadedPath.includes('[') && preloadedPath.startsWith('/api/')) {
                                exports = preloadedExports;
                                break;
                            }
                        }
                        if (exports) break;
                    }
                }
            }
        }
        
        if (!exports) return Router.NOT_FOUND_RESPONSE;

        const handler = exports[request.method] || exports.default;
        if (!handler || typeof handler !== "function") {
            return Router.METHOD_NOT_ALLOWED_RESPONSE;
        }

        try {
            const context = this.getMinimalApiContext(request, params);
            const response = await handler(context);
            
            if (response instanceof Response) return response;

            return new Response(JSON.stringify(response), {
                headers: { "Content-Type": "application/json" },
            });
        } catch (error) {
            console.error(`API Error [${request.method} ${path}]:`, error);
            return Router.INTERNAL_ERROR_RESPONSE;
        }
    }

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
        if (this.contextPool.length < 100) {
            this.contextPool.push(context);
        }
    }

    private getMinimalApiContext(request: Request, params: Record<string, string> = {}): RouteContext {
        return {
            request,
            params,
            query: new URLSearchParams(request.url.split('?')[1] || ''),
            state: {},
        };
    }

    private async handleStaticFile(path: string): Promise<Response | null> {
        if (path.endsWith(".css")) {
            const cssPath = this.config.tailwind?.cssPath || "./styles.css";
            try {
                const cssFile = Bun.file(cssPath);
                if (await cssFile.exists()) {
                    return new Response(cssFile, {
                        headers: {
                            "Content-Type": "text/css",
                            "Cache-Control": this.config.dev ? "no-cache" : "public, max-age=3600",
                        },
                    });
                }
            } catch {
                // File not found
            }
        }

        if (path === "/favicon.ico") {
            return new Response(null, { status: 204 });
        }

        return null;
    }

    private async renderPage(
        PageComponent: any,
        props: { data: any; params: Record<string, string>; state: ServerGlobalState },
        uiFramework: UIFramework = "react",
        meta: RouteMeta = {},
        options: { clientScript?: () => void } = {}
    ): Promise<string> {
        switch (uiFramework) {
            case "react":
                const reactContent = await ReactAdapter.renderToString(PageComponent, props);
                return ReactAdapter.createDocument(reactContent, meta, this.config, {
                    clientScript: options.clientScript,
                });

            case "htmx":
                const htmxContent = await HTMXAdapter.renderToString(PageComponent, props);
                return HTMXAdapter.createDocument(htmxContent, meta, this.config);
                
            default:
                throw new Error(`Unsupported UI framework: ${uiFramework}`);
        }
    }
}
