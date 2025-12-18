import { RouteContext } from "kilatjs";

// Mock user data
const users = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com" },
    { id: 2, name: "Bob Smith", email: "bob@example.com" },
    { id: 3, name: "Charlie Brown", email: "charlie@example.com" },
    { id: 4, name: "Diana Prince", email: "diana@example.com" },
    { id: 5, name: "Edward Norton", email: "edward@example.com" },
    { id: 6, name: "Fiona Apple", email: "fiona@example.com" },
];

// HTMX search endpoint - returns HTML fragment
export async function GET(ctx: RouteContext) {
    const query = ctx.query.get("q")?.toLowerCase() || "";

    if (!query) {
        return new Response(
            `<p class="text-neutral-400 text-sm">Start typing to search...</p>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    const results = users.filter(
        (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query)
    );

    if (results.length === 0) {
        return new Response(
            `<p class="text-neutral-500 text-sm">No users found for "${query}"</p>`,
            { headers: { "Content-Type": "text/html" } }
        );
    }

    const html = results
        .map(
            (user) => `
        <div class="p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
            <div>
                <div class="font-medium">${user.name}</div>
                <div class="text-sm text-neutral-500">${user.email}</div>
            </div>
            <span class="text-xs bg-violet-100 text-violet-600 px-2 py-1 rounded">ID: ${user.id}</span>
        </div>
    `
        )
        .join("");

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
