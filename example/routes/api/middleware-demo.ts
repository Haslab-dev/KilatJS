import { RouteContext, Middleware } from "kilatjs";

// Route-specific middleware
const authMiddleware: Middleware = async (ctx, next) => {
    const authHeader = ctx.request.headers.get("Authorization");
    
    if (!authHeader || authHeader !== "Bearer secret-token") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
        });
    }
    
    // Add user data to state
    ctx.state.user = { id: 1, name: "Admin" };
    
    return next();
};

export const middlewares = [authMiddleware];

export async function GET(ctx: RouteContext) {
    return {
        message: "Welcome to the protected middleware demo!",
        user: ctx.state.user
    };
}
