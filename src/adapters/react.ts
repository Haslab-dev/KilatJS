import { renderToStaticMarkup } from "react-dom/server";
import React from "react";
import { PageProps, RouteMeta, KilatConfig } from "../core/types";

export class ReactAdapter {
    static async renderToString(
        component: React.ComponentType<PageProps>,
        props: PageProps
    ): Promise<string> {
        try {
            const element = React.createElement(component, props);
            const html = renderToStaticMarkup(element);
            return html;
        } catch (error) {
            console.error("Error rendering React component:", error);
            throw error;
        }
    }

    static createDocument(html: string, meta: RouteMeta = {}, config?: KilatConfig): string {
        const title = meta.title || "KilatJS App";
        const description = meta.description || "";
        const robots = meta.robots || "index,follow";

        let metaTags = "";

        // Essential meta tags
        metaTags += `<meta charset="utf-8" />\n    `;
        metaTags += `<meta name="viewport" content="width=device-width, initial-scale=1" />\n    `;
        metaTags += `<meta name="robots" content="${robots}" />\n    `;

        if (description) {
            metaTags += `<meta name="description" content="${this.escapeHtml(description)}" />\n    `;
        }

        // Canonical URL
        if (meta.canonical) {
            metaTags += `<link rel="canonical" href="${this.escapeHtml(meta.canonical)}" />\n    `;
        }

        // Open Graph meta tags
        metaTags += `<meta property="og:title" content="${this.escapeHtml(meta.ogTitle || title)}" />\n    `;
        if (meta.ogDescription || description) {
            metaTags += `<meta property="og:description" content="${this.escapeHtml(meta.ogDescription || description)}" />\n    `;
        }
        if (meta.ogImage) {
            metaTags += `<meta property="og:image" content="${this.escapeHtml(meta.ogImage)}" />\n    `;
        }

        // Twitter Card meta tags
        const twitterCard = meta.twitterCard || "summary";
        metaTags += `<meta name="twitter:card" content="${twitterCard}" />\n    `;

        // Custom meta tags
        const reservedKeys = [
            "title",
            "description",
            "robots",
            "canonical",
            "ogTitle",
            "ogDescription",
            "ogImage",
            "twitterCard",
        ];
        Object.entries(meta).forEach(([key, value]) => {
            if (!reservedKeys.includes(key) && typeof value === "string") {
                metaTags += `<meta name="${this.escapeHtml(key)}" content="${this.escapeHtml(value)}" />\n    `;
            }
        });

        // CSS link (with cache-busting in dev mode)
        const cssUrl = config?.dev ? `/styles.css?v=${Date.now()}` : '/styles.css';
        metaTags += `<link rel="stylesheet" href="${cssUrl}" />\n    `;

        // Google Fonts for modern typography
        metaTags += `<link rel="preconnect" href="https://fonts.googleapis.com" />\n    `;
        metaTags += `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n    `;
        metaTags += `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />\n    `;

        return `<!DOCTYPE html>
<html lang="en">
  <head>
    <title>${this.escapeHtml(title)}</title>
    ${metaTags}
  </head>
  <body>
    <div id="root">
      ${html}
    </div>
    ${
        config?.dev
            ? `<script>
      (function() {
        let currentServerId = null;
        let isReconnecting = false;
        
        function connect() {
            const source = new EventSource('/_kilat/live-reload');
            
            source.onmessage = (event) => {
                const newServerId = event.data;
                if (currentServerId === null) {
                    currentServerId = newServerId;
                } else if (currentServerId !== newServerId) {
                    // Server ID changed, reload!
                    location.reload();
                }
            };

            source.onerror = () => {
                source.close();
                // Try to reconnect in 1s
                setTimeout(connect, 1000);
            };
        }
        
        connect();
      })();
    </script>`
            : ""
    }
  </body>
</html>`;
    }

    private static escapeHtml(str: string): string {
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}