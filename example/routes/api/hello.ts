import { RouteContext } from "../../../src";

/**
 * Ultra-simple Hello World API endpoint for benchmarking
 */

export async function GET(ctx: RouteContext) {
    return { message: "Hello World! HAHA" };
}