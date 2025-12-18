/**
 * Live Reload Server for KilatJS
 * 
 * Provides browser auto-refresh when files change.
 * Works with pure SSR - no client-side hydration needed.
 */

import { ServerWebSocket } from "bun";

// Connected clients
const clients = new Set<ServerWebSocket<unknown>>();

// Live reload WebSocket server
let liveReloadServer: ReturnType<typeof Bun.serve> | null = null;

/**
 * Start the live reload WebSocket server
 */
export function startLiveReload(port: number = 35729): void {
    if (liveReloadServer) return;

    liveReloadServer = Bun.serve({
        port,
        fetch(req, server) {
            // Upgrade to WebSocket
            if (server.upgrade(req, { data: {} })) {
                return;
            }
            return new Response("Live Reload Server", { status: 200 });
        },
        websocket: {
            open(ws) {
                clients.add(ws);
            },
            close(ws) {
                clients.delete(ws);
            },
            message() {
                // No messages expected from client
            },
        },
    });

    // Silent - no console output
}

/**
 * Notify all connected browsers to reload
 */
export function notifyReload(filename?: string): void {
    const message = JSON.stringify({ type: "reload", filename });
    for (const client of clients) {
        try {
            client.send(message);
        } catch {
            clients.delete(client);
        }
    }
}

/**
 * Get the live reload client script to inject into HTML
 */
export function getLiveReloadScript(port: number = 35729): string {
    return `
<script>
(function() {
    const ws = new WebSocket('ws://localhost:${port}');
    ws.onmessage = function(e) {
        const data = JSON.parse(e.data);
        if (data.type === 'reload') {
            if (data.filename && (data.filename.endsWith('.css') || data.filename.endsWith('input.css'))) {
                console.log('[KilatJS] Hot reloading CSS...');
                const links = document.getElementsByTagName("link");
                for (let i = 0; i < links.length; i++) {
                    const link = links[i];
                    if (link.rel === "stylesheet") {
                        const url = new URL(link.href, location.href);
                        url.searchParams.set('t', Date.now());
                        link.href = url.toString();
                    }
                }
                return;
            }
            console.log('[KilatJS] Reloading...');
            location.reload();
        }
    };
    ws.onclose = function() {
        console.log('[KilatJS] Live reload disconnected. Reconnecting...');
        setTimeout(function() { location.reload(); }, 1000);
    };
})();
</script>`;
}

/**
 * Watch a directory for changes and trigger reload
 * Uses a polling-based approach that works reliably with Bun
 */
export async function watchDirectory(dir: string, onChange: (filename: string) => void): Promise<void> {
    // Track file modification times
    const fileTimestamps = new Map<string, number>();
    
    // Debounce
    let timeout: Timer | null = null;
    let lastChange = 0;

    const triggerChange = (filename: string) => {
        const now = Date.now();
        if (now - lastChange < 100) return;
        lastChange = now;

        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            // Silent reload - no console output
            onChange(filename);
        }, 50);
    };

    // Scan directory for files safely
    async function scanFiles(currentDir: string): Promise<Map<string, number>> {
        const timestamps = new Map<string, number>();
        try {
            const entries = await Bun.file(currentDir).exists() ? [] : []; // Just a check
            // Use readdir for manual control over recursion
            const { readdir } = await import("fs/promises");
            const files = await readdir(currentDir, { withFileTypes: true });

            for (const file of files) {
                const fullPath = `${currentDir}/${file.name}`;
                
                // Skip sensitive/large directories early
                if (file.isDirectory()) {
                    if (file.name === "node_modules" || file.name === ".git" || file.name === "dist") continue;
                    const subTimestamps = await scanFiles(fullPath);
                    for (const [p, t] of subTimestamps) timestamps.set(p, t);
                } else if (file.isFile() && /\.(ts|tsx|js|jsx|css)$/.test(file.name)) {
                    try {
                        const stat = Bun.file(fullPath);
                        const lastModified = (await stat.stat())?.mtime?.getTime() || 0;
                        timestamps.set(fullPath, lastModified);
                    } catch {
                        // File might have been deleted/locked
                    }
                }
            }
        } catch (error) {
            // Silently handle errors for specific files/dirs
        }
        return timestamps;
    }

    // Initial scan
    const initialFiles = await scanFiles(dir);
    for (const [file, time] of initialFiles) {
        fileTimestamps.set(file, time);
    }

    // Poll for changes every 500ms
    const pollInterval = setInterval(async () => {
        const currentFiles = await scanFiles(dir);
        
        // Check for new or modified files
        for (const [file, time] of currentFiles) {
            const previousTime = fileTimestamps.get(file);
            if (previousTime === undefined || previousTime < time) {
                fileTimestamps.set(file, time);
                if (previousTime !== undefined) {
                    // File was modified (not just discovered)
                    const relativePath = file.replace(dir + "/", "");
                    triggerChange(relativePath);
                }
            }
        }

        // Check for deleted files
        for (const file of fileTimestamps.keys()) {
            if (!currentFiles.has(file)) {
                fileTimestamps.delete(file);
                const relativePath = file.replace(dir + "/", "");
                triggerChange(relativePath);
            }
        }
    }, 500);

    // Store interval for cleanup (not implemented yet, but could be)
    (globalThis as any).__kilatWatchIntervals = (globalThis as any).__kilatWatchIntervals || [];
    (globalThis as any).__kilatWatchIntervals.push(pollInterval);
}

/**
 * Stop the live reload server
 */
export function stopLiveReload(): void {
    if (liveReloadServer) {
        liveReloadServer.stop();
        liveReloadServer = null;
    }
    clients.clear();
}
