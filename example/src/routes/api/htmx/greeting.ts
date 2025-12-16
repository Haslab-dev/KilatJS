// HTMX API endpoint - returns HTML fragment
export async function GET() {
    const greetings = [
        "Hello from the server! 👋",
        "Greetings, traveler! 🌟",
        "Welcome to KilatJS! ⚡",
        "Server says hi! 🚀",
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const time = new Date().toLocaleTimeString();

    // Return HTML fragment (not JSON!)
    return new Response(
        `<div class="text-lg font-medium text-violet-600">${greeting}</div>
         <div class="text-sm text-neutral-500 mt-1">Loaded at ${time}</div>`,
        { headers: { "Content-Type": "text/html" } }
    );
}
