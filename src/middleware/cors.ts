import { Middleware } from "../core/types";

export interface CorsOptions {
    origin?: string | string[] | boolean;
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
}

/**
 * CORS Middleware for KilatJS
 */
export const cors = (options: CorsOptions = {}): Middleware => {
    return async (ctx, next) => {
        const origin = options.origin ?? "*";
        const methods = options.methods ?? ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];
        const headers = options.allowedHeaders ?? ["Content-Type", "Authorization"];

        // Handle preflight
        if (ctx.request.method === "OPTIONS") {
            return new Response(null, {
                status: 204,
                headers: {
                    "Access-Control-Allow-Origin": String(origin),
                    "Access-Control-Allow-Methods": methods.join(", "),
                    "Access-Control-Allow-Headers": headers.join(", "),
                    "Access-Control-Max-Age": String(options.maxAge ?? 86400),
                    "Access-Control-Allow-Credentials": String(options.credentials ?? false),
                }
            });
        }

        const response = await next();

        // Add CORS headers to the response
        response.headers.set("Access-Control-Allow-Origin", String(origin));
        response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
        response.headers.set("Access-Control-Allow-Headers", headers.join(", "));
        if (options.credentials) {
            response.headers.set("Access-Control-Allow-Credentials", "true");
        }

        return response;
    };
};
