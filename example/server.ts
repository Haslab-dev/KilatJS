import KilatJS, { cors, jwt, swagger, RouteContext } from "kilatjs/core";
const app = new KilatJS();

// 1. Global Middleware
app.use(cors({
    origin: "*",
    credentials: true
}));

// Register Swagger documentation
app.use(swagger(app, {
    path: "/docs",
    title: "KilatJS Example API",
    description: "Lightning fast API with automatic documentation"
}));

// Simple logger middleware
app.use(async (ctx: RouteContext, next) => {
    const start = Date.now();
    const url = new URL(ctx.request.url);
    console.log(`[API] ${ctx.request.method} ${url.pathname}`);
    const response = await next();
    const ms = Date.now() - start;
    response.headers.set("X-Response-Time", `${ms}ms`);
    return response;
});

// 2. Public Routes
app.get("/", {
    summary: "Root endpoint",
    response: { message: "string", status: "string" }
}, (ctx: RouteContext) => {
    return { message: "Welcome to KilatJS Core API!", status: "success" };
});

app.get("/api/hello", {
    summary: "Say hello",
    response: { message: "string", timestamp: 0 }
}, (ctx: RouteContext) => {
    const name = ctx.query.get("name") || "Guest";
    return { message: `Hello, ${name}!`, timestamp: Date.now() };
});

// 3. Protected Route with custom JWT middleware
app.get("/api/profile", 
    jwt({ secret: "my-super-secret" }), 
    {
        summary: "Get user profile",
        description: "Requires JWT authentication",
        response: { message: "string", user: {} }
    },
    (ctx: RouteContext) => {
        return { 
            message: "This is a protected profile", 
            user: ctx.state.user // Extracted by JWT middleware
        };
});

// 4. Dynamic Routing
app.get("/api/users/:id", {
    summary: "Get user by ID",
    response: { id: "string", name: "string", role: "string", url: "string" }
}, (ctx: RouteContext) => {
    const { id } = ctx.params;
    return { 
        id, 
        name: `User ${id}`,
        role: "developer",
        url: ctx.request.url
    };
});

// 5. POST Request
app.post("/api/echo", {
    summary: "Echo back request body",
    body: { text: "string" },
    response: { echo: {}, receivedAt: "string" }
}, async (ctx: RouteContext) => {
    try {
        const body = await ctx.request.json();
        return { 
            echo: body,
            receivedAt: new Date().toISOString()
        };
    } catch (e) {
        return { error: "Invalid JSON body" };
    }
});

// Start the server
const port = 4000;
app.listen(port, () => {
    console.log(`
🚀 KilatJS Standalone API Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ➜ Local: http://localhost:${port}
  ➜ Docs:  http://localhost:${port}/docs
  ➜ JSON-first API mode
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
});
