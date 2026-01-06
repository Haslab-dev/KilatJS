import { Middleware, RouteContext } from "./types";

/**
 * Handler function type for standalone API
 */
export type Handler<TBody = any, TResponse = any> = (ctx: RouteContext) => TResponse | Promise<TResponse>;

export interface RouteOptions {
    body?: any;
    response?: any;
    summary?: string;
    description?: string;
    tags?: string[];
}

export class KilatJS {
    private routes: Array<{ 
        method: string; 
        path: string;
        pattern: RegExp; 
        paramNames: string[]; 
        handler: Handler; 
        middlewares: Middleware[];
        options?: RouteOptions;
    }> = [];
    private globalMiddlewares: Middleware[] = [];

    /**
     * Use a global middleware
     */
    use(middleware: Middleware) {
        this.globalMiddlewares.push(middleware);
        return this;
    }

    private register(method: string, path: string, handlers: Array<Middleware | Handler | RouteOptions>) {
        let options: RouteOptions | undefined;
        const middleAndHandler: Array<Middleware | Handler> = [];

        for (const h of handlers) {
            if (typeof h === 'object' && h !== null && !Array.isArray(h) && !('fetch' in h) && Object.keys(h).some(k => ['body', 'response', 'summary', 'description', 'tags'].includes(k))) {
                options = h as RouteOptions;
            } else {
                middleAndHandler.push(h as any);
            }
        }

        const handler = middleAndHandler.pop() as Handler;
        const middlewares = middleAndHandler as Middleware[];
        
        const paramNames: string[] = [];
        // Support both :param and [param]
        const normalizedPath = path.replace(/\[([^\]]+)\]/g, ':$1');
        
        const regexStr = normalizedPath
            .replace(/:([^\/]+)/g, (_, name) => {
                paramNames.push(name);
                return '([^/]+)';
            })
            .replace(/\//g, '\\/');
        
        const pattern = new RegExp(`^${regexStr}$`);
        
        this.routes.push({ method, path, pattern, paramNames, handler, middlewares, options });
        return this;
    }

    get(path: string, handler: Handler): this;
    get(path: string, options: RouteOptions, handler: Handler): this;
    get(path: string, m1: Middleware, handler: Handler): this;
    get(path: string, m1: Middleware, options: RouteOptions, handler: Handler): this;
    get(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    get(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('GET', path, handlers); }

    post(path: string, handler: Handler): this;
    post(path: string, options: RouteOptions, handler: Handler): this;
    post(path: string, m1: Middleware, handler: Handler): this;
    post(path: string, m1: Middleware, options: RouteOptions, handler: Handler): this;
    post(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    post(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('POST', path, handlers); }

    put(path: string, handler: Handler): this;
    put(path: string, options: RouteOptions, handler: Handler): this;
    put(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    put(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('PUT', path, handlers); }

    delete(path: string, handler: Handler): this;
    delete(path: string, options: RouteOptions, handler: Handler): this;
    delete(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    delete(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('DELETE', path, handlers); }

    patch(path: string, handler: Handler): this;
    patch(path: string, options: RouteOptions, handler: Handler): this;
    patch(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    patch(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('PATCH', path, handlers); }

    all(path: string, handler: Handler): this;
    all(path: string, options: RouteOptions, handler: Handler): this;
    all(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>): this;
    all(path: string, ...handlers: Array<Middleware | Handler | RouteOptions>) { return this.register('ALL', path, handlers); }

    /**
     * Get registered routes with documentation
     */
    getRoutes() {
        return this.routes;
    }

    /**
     * Main fetch handler for Bun.serve
     */
    async fetch(req: Request): Promise<Response> {
        const url = new URL(req.url);
        const path = url.pathname;
        const method = req.method;

        const ctx: RouteContext = {
            request: req,
            params: {},
            query: url.searchParams,
            state: {}
        };

        const routerHandler = async (): Promise<Response> => {
            for (const route of this.routes) {
                if (route.method === method || route.method === 'ALL') {
                    const match = path.match(route.pattern);
                    if (match) {
                        const params: Record<string, string> = {};
                        route.paramNames.forEach((name, i) => {
                            params[name] = match[i + 1];
                        });
                        ctx.params = params;

                        const handlerExec = async () => {
                            try {
                                const result = await route.handler(ctx);
                                if (result instanceof Response) return result;
                                
                                return new Response(JSON.stringify(result), {
                                    headers: { "Content-Type": "application/json" }
                                });
                            } catch (error: any) {
                                return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), {
                                    status: 500,
                                    headers: { "Content-Type": "application/json" }
                                });
                            }
                        };

                        if (route.middlewares.length > 0) {
                            return this.executeMiddlewares(route.middlewares, ctx, handlerExec);
                        } else {
                            return handlerExec();
                        }
                    }
                }
            }

            return new Response(JSON.stringify({ error: "Not Found" }), { 
                status: 404,
                headers: { "Content-Type": "application/json" }
            });
        };

        if (this.globalMiddlewares.length > 0) {
            return this.executeMiddlewares(this.globalMiddlewares, ctx, routerHandler);
        } else {
            return routerHandler();
        }
    }

    private async executeMiddlewares(
        middlewares: Middleware[], 
        ctx: RouteContext, 
        handler: () => Promise<Response>
    ): Promise<Response> {
        let index = -1;
        const next = async (): Promise<Response> => {
            index++;
            if (index < middlewares.length) {
                try {
                    return await middlewares[index](ctx, next);
                } catch (error: any) {
                    return new Response(JSON.stringify({ error: error.message || "Middleware Error" }), {
                        status: 500,
                        headers: { "Content-Type": "application/json" }
                    });
                }
            }
            return handler();
        };
        return next();
    }

    /**
     * Start the standalone server
     */
    listen(port: number = 3000, callback?: (server: any) => void) {
        const server = Bun.serve({
            port,
            fetch: (req) => this.fetch(req),
        });
        
        if (callback) callback(server);
        return server;
    }
}

// Default export
export default KilatJS;
