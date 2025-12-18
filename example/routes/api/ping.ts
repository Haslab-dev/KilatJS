import { RouteContext } from "../../../../src";

/**
 * Ultra-minimal ping endpoint - returns pre-compiled response
 */

// Pre-compiled response for maximum performance
const PING_RESPONSE = new Response('{"status":"ok"}', {
    headers: { "Content-Type": "application/json" }
});

export async function GET(ctx: RouteContext) {
    return PING_RESPONSE;
}