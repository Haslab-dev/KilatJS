import { KilatJS } from "../core/kilat";
import { Middleware } from "../core/types";

export interface SwaggerOptions {
    path?: string;
    title?: string;
    version?: string;
    description?: string;
}

/**
 * Swagger Documentation Middleware for KilatJS
 */
export const swagger = (app: KilatJS, options: SwaggerOptions = {}): Middleware => {
    const swaggerPath = options.path ?? "/docs";
    const title = options.title ?? "KilatJS API Documentation";
    const version = options.version ?? "1.0.0";
    const description = options.description ?? "API Documentation for KilatJS";

    return async (ctx, next) => {
        const url = new URL(ctx.request.url);
        
        // Handle Swagger JSON request
        if (url.pathname === `${swaggerPath}/json`) {
            const routes = app.getRoutes();
            const paths: any = {};

            routes.forEach(route => {
                // Skip the swagger routes themselves
                if (route.path.startsWith(swaggerPath)) return;

                const path = route.path.replace(/:([^\/]+)/g, "{$1}");
                if (!paths[path]) paths[path] = {};

                const method = route.method.toLowerCase();
                const routeOpts = route.options || {};

                paths[path][method === 'all' ? 'get' : method] = {
                    summary: routeOpts.summary || `${route.method} ${route.path}`,
                    description: routeOpts.description || "",
                    tags: routeOpts.tags || [],
                    parameters: route.paramNames.map(name => ({
                        name,
                        in: "path",
                        required: true,
                        schema: { type: "string" }
                    })),
                    responses: {
                        "200": {
                            description: "Successful response",
                            content: {
                                "application/json": {
                                    schema: routeOpts.response ? 
                                        ({ type: "object", properties: mapTypeToSwagger(routeOpts.response) }) : 
                                        ({ type: "object" })
                                }
                            }
                        }
                    },
                    ...(routeOpts.body && (method === 'post' || method === 'put' || method === 'patch') ? {
                        requestBody: {
                            content: {
                                "application/json": {
                                    schema: { type: "object", properties: mapTypeToSwagger(routeOpts.body) }
                                }
                            }
                        }
                    } : {})
                };
            });

            return new Response(JSON.stringify({
                openapi: "3.0.0",
                info: { title, version, description },
                paths
            }), {
                headers: { "Content-Type": "application/json" }
            });
        }

        // Handle Swagger UI HTML request
        if (url.pathname === swaggerPath) {
            const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
    <style>
        html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
        *, *:before, *:after { box-sizing: inherit; }
        body { margin: 0; background: #fafafa; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js" charset="UTF-8"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js" charset="UTF-8"></script>
    <script>
    window.onload = function() {
        const ui = SwaggerUIBundle({
            url: "${swaggerPath}/json",
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout"
        });
        window.ui = ui;
    };
    </script>
</body>
</html>`;
            return new Response(html, {
                headers: { "Content-Type": "text/html" }
            });
        }

        return next();
    };
};

function mapTypeToSwagger(obj: any): any {
    if (!obj || typeof obj !== 'object') return { type: "string" };
    
    const properties: any = {};
    for (const key in obj) {
        const val = obj[key];
        if (Array.isArray(val)) {
            properties[key] = { type: "array", items: { type: "string" } };
        } else if (typeof val === 'object') {
            properties[key] = { type: "object", properties: mapTypeToSwagger(val) };
        } else {
            properties[key] = { type: typeof val };
        }
    }
    return properties;
}
