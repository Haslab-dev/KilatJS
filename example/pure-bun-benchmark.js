// Pure Bun server for comparison
const PING_RESPONSE = new Response('{"status":"ok"}', {
    headers: { "Content-Type": "application/json" }
});

Bun.serve({
    port: 3001,
    fetch(req) {
        return PING_RESPONSE;
    }
});

console.log("Pure Bun server running on http://localhost:3001");