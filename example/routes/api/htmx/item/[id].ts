import { RouteContext } from "kilatjs";

// HTMX delete endpoint - returns empty response to remove element
export async function DELETE(ctx: RouteContext) {
    const { id } = ctx.params;

    // Simulate deletion
    await new Promise((resolve) => setTimeout(resolve, 200));

    console.log(`Deleted item ${id}`);

    // Return empty string to remove the element from DOM
    return new Response("", { headers: { "Content-Type": "text/html" } });
}
