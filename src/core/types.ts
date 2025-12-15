// Core types for KilatJS framework

/**
 * Route rendering modes:
 * - "static": Pre-built at build time (SSG) - for known, unchanging paths
 * - "ssr": Server-rendered on each request - for dynamic content
 * - "api": Pure server handler, no HTML rendering - for API endpoints
 */
export type RenderMode = "static" | "ssr" | "api";
export type UIFramework = "react" | "htmx";

/**
 * Route type classification for build/runtime decisions:
 * - "static": Routes without dynamic segments, built at compile time
 * - "dynamic": Routes with [param] segments, rendered at runtime
 * - "api": Routes under /api/*, server-only handlers
 */
export type RouteType = "static" | "dynamic" | "api";

export interface RouteMeta {
    title?: string;
    description?: string;
    robots?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    twitterCard?: "summary" | "summary_large_image";
    [key: string]: any;
}

export interface RouteContext {
    request: Request;
    params: Record<string, string>;
    query: URLSearchParams;
    state: ServerGlobalState;
}

export interface ServerGlobalState {
    [key: string]: any;
}

export interface RouteExports {
    mode?: RenderMode;
    ui?: UIFramework;
    load?: (ctx: RouteContext) => Promise<any> | any;
    meta?: RouteMeta;
    getStaticPaths?: () => Promise<string[]> | string[];
    POST?: (ctx: RouteContext) => Promise<Response> | Response;
    PUT?: (ctx: RouteContext) => Promise<Response> | Response;
    DELETE?: (ctx: RouteContext) => Promise<Response> | Response;
    PATCH?: (ctx: RouteContext) => Promise<Response> | Response;
    default: (props: PageProps) => any;
}

export interface PageProps {
    data: any;
    params: Record<string, string>;
    state: ServerGlobalState;
}

export interface RouteMatch {
    route: string;
    params: Record<string, string>;
    exports: RouteExports;
    routeType: RouteType;
}

export interface TailwindConfig {
    enabled: boolean;
    inputPath?: string;
    cssPath: string;
    configPath?: string;
}

export interface KilatConfig {
    routesDir: string;
    outDir: string;
    port?: number;
    hostname?: string;
    dev?: boolean;
    publicDir?: string;
    tailwind?: TailwindConfig;
}

// Helper type for loader data
export type LoaderData<T extends (...args: any) => any> = Awaited<ReturnType<T>>;