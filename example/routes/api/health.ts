import { RouteContext } from "../../../../src";

/**
 * API Route: /api/health
 * 
 * API routes are server-only handlers that leverage Bun's fast server.
 * They don't render HTML - just return JSON responses.
 * 
 * Export HTTP method handlers: GET, POST, PUT, DELETE, PATCH
 */

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
    checks: {
        name: string;
        status: "pass" | "fail";
        responseTime?: number;
        message?: string;
    }[];
}

const startTime = Date.now();

// GET /api/health - Health check endpoint
export async function GET(ctx: RouteContext) {
    const verbose = ctx.query.get("verbose") === "true";

    const healthStatus: HealthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: "0.1.0",
        environment: process.env.NODE_ENV || "development",
        checks: [],
    };

    // Memory check
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const heapTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    healthStatus.checks.push({
        name: "memory",
        status: memoryPercent < 90 ? "pass" : "fail",
        message: `${heapUsedMB}MB / ${heapTotalMB}MB (${memoryPercent.toFixed(1)}%)`,
    });

    // Database simulation (would be real check in production)
    healthStatus.checks.push({
        name: "database",
        status: "pass",
        responseTime: Math.random() * 10 + 1,
        message: "Connected",
    });

    // External API simulation
    healthStatus.checks.push({
        name: "external_api",
        status: "pass",
        responseTime: Math.random() * 50 + 10,
        message: "Reachable",
    });

    // Determine overall status
    const failedChecks = healthStatus.checks.filter(c => c.status === "fail");
    if (failedChecks.length > 0) {
        healthStatus.status = failedChecks.length === healthStatus.checks.length ? "unhealthy" : "degraded";
    }

    const body = verbose 
        ? JSON.stringify(healthStatus, null, 2)
        : JSON.stringify({ status: healthStatus.status, timestamp: healthStatus.timestamp });

    return new Response(body, {
        status: healthStatus.status === "healthy" ? 200 : 503,
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
        },
    });
}
