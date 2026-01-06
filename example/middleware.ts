import { Middleware, MiddlewareConfig } from "kilatjs";

/**
 * Next.js-style middleware.ts
 * This function runs before all matching routes.
 */
export const middleware: Middleware = async (ctx, next) => {
    // Add a custom header to all matching requests
    console.log(`[Middleware.ts] Processing: ${ctx.request.url}`);
    
    // You can intercept and return a response early
    if (ctx.request.url.includes("/api/private")) {
        return new Response(JSON.stringify({ error: "Access Denied by middleware.ts" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
        });
    }

    const response = await next();
    response.headers.set("X-Kilat-Middleware", "true");
    return response;
};

/**
 * Optional matcher config (like Next.js)
 */
export const config: MiddlewareConfig = {
    // Only run for these paths
    // Supports exact paths and * wildcards
    matcher: [
        "/",
        "/api/*",
        "/middleware-ssr"
    ]
};
