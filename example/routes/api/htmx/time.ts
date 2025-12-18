// HTMX time endpoint - returns current server time
export async function GET() {
    const now = new Date();
    const time = now.toLocaleTimeString();
    const date = now.toLocaleDateString();

    return new Response(
        `<div>
            <div class="text-2xl font-bold text-violet-600">${time}</div>
            <div class="text-sm text-neutral-500">${date}</div>
        </div>`,
        { headers: { "Content-Type": "text/html" } }
    );
}
