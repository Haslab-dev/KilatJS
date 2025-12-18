import { RouteContext } from "kilatjs";

// HTMX subscribe endpoint - returns HTML fragment
export async function POST(ctx: RouteContext) {
    const formData = await ctx.request.formData();
    const email = formData.get("email");

    // Simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Validate email
    if (!email || !String(email).includes("@")) {
        return new Response(
            `<div class="p-3 bg-red-50 text-red-600 rounded-lg">
                ✗ Please enter a valid email address
            </div>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    return new Response(
        `<div class="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            ✓ Successfully subscribed ${email}!
        </div>`,
        { headers: { "Content-Type": "text/html" } }
    );
}
