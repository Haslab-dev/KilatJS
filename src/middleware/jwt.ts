import { Middleware } from "../core/types";

export interface JwtOptions {
    secret: string;
    algorithms?: string[];
    getToken?: (request: Request) => string | null;
}

/**
 * JWT Middleware for KilatJS (Basic Implementation)
 * In a real production app, you might want to use 'jose' or 'jsonwebtoken'
 */
export const jwt = (options: JwtOptions): Middleware => {
    return async (ctx, next) => {
        const getAuthToken = options.getToken || ((req) => {
            const auth = req.headers.get("Authorization");
            if (auth && auth.startsWith("Bearer ")) {
                return auth.slice(7);
            }
            return null;
        });

        const token = getAuthToken(ctx.request);

        if (!token) {
            return new Response(JSON.stringify({ error: "Unauthorized: No token provided" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }

        try {
            // BASIC VERIFICATION (Mocking for now as full JWT RS256/HS256 requires heavy crypto)
            // In a real implementation with jose: const { payload } = await jwtVerify(token, new TextEncoder().encode(options.secret));
            
            // For now, let's just decode the header/payload to demonstrate
            const parts = token.split('.');
            if (parts.length !== 3) throw new Error("Invalid token format");
            
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            
            // Attach to state
            ctx.state.user = payload;
            
            return await next();
        } catch (error) {
            return new Response(JSON.stringify({ error: "Unauthorized: Invalid token" }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
            });
        }
    };
};
