import { defineConfig, Middleware } from "kilatjs";

export default defineConfig({
    appDir: ".",
    outDir: "./dist",
    port: 3000,
    hostname: "localhost",
    ssrRoot: true,
    clientRoute: "/client",
    publicDir: "./public",
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./public/styles.css",
    },
    middlewares: [
        async (ctx, next) => {
            const start = Date.now();
            console.log(`[Global Middleware] ${ctx.request.method} ${ctx.request.url}`);
            const response = await next();
            const duration = Date.now() - start;
            response.headers.set("X-Response-Time", `${duration}ms`);
            return response;
        }
    ] as Middleware[]
});
