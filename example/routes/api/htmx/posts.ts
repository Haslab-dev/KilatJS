import { RouteContext } from "kilatjs";

// HTMX posts endpoint - returns HTML fragments for infinite scroll
export async function GET(ctx: RouteContext) {
    const page = parseInt(ctx.query.get("page") || "1");
    const perPage = 3;
    const start = (page - 1) * perPage + 1;

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    const posts = [];
    for (let i = start; i < start + perPage; i++) {
        posts.push(`
            <div class="p-3 bg-neutral-50 rounded-lg">
                Post ${i}: ${getRandomTitle()}
            </div>
        `);
    }

    return new Response(posts.join(""), {
        headers: { "Content-Type": "text/html" },
    });
}

function getRandomTitle() {
    const titles = [
        "Understanding Server-Side Rendering",
        "Why HTML-First Matters",
        "Building Fast Websites with Bun",
        "The Return of Server-Driven UI",
        "Progressive Enhancement in 2024",
        "HTMX: The Future of Web Development",
        "Simplicity Over Complexity",
        "No JavaScript Required",
    ];
    return titles[Math.floor(Math.random() * titles.length)];
}
