import { PageProps, RouteMeta, KilatConfig } from "../core/types";
import { getLiveReloadScript } from "../server/live-reload";

/**
 * HTMX Adapter - For building HTMX-enhanced HTML pages
 * Provides utilities for generating HTMX-compatible responses and partial updates
 */
export class HTMXAdapter {
    /**
     * Render a template function to HTML string
     */
    static async renderToString(
        template: (props: PageProps) => string | Promise<string>,
        props: PageProps
    ): Promise<string> {
        try {
            const html = await template(props);
            return html;
        } catch (error) {
            console.error("Error rendering HTMX template:", error);
            throw error;
        }
    }

    /**
     * Check if the request is an HTMX request
     */
    static isHTMXRequest(request: Request): boolean {
        return request.headers.get("HX-Request") === "true";
    }

    /**
     * Check if this is a boosted request (HTMX boost attribute)
     */
    static isBoostedRequest(request: Request): boolean {
        return request.headers.get("HX-Boosted") === "true";
    }

    /**
     * Get the current URL before the HTMX request was made
     */
    static getCurrentUrl(request: Request): string | null {
        return request.headers.get("HX-Current-URL");
    }

    /**
     * Get the ID of the element that triggered the request
     */
    static getTrigger(request: Request): string | null {
        return request.headers.get("HX-Trigger");
    }

    /**
     * Get the name of the element that triggered the request
     */
    static getTriggerName(request: Request): string | null {
        return request.headers.get("HX-Trigger-Name");
    }

    /**
     * Get the ID of the target element
     */
    static getTarget(request: Request): string | null {
        return request.headers.get("HX-Target");
    }

    /**
     * Create a response with HTMX-specific headers
     */
    static createResponse(
        html: string,
        options: HTMXResponseOptions = {}
    ): Response {
        const headers = new Headers({
            "Content-Type": "text/html; charset=utf-8",
        });

        // HTMX response headers
        if (options.retarget) {
            headers.set("HX-Retarget", options.retarget);
        }
        if (options.reswap) {
            headers.set("HX-Reswap", options.reswap);
        }
        if (options.trigger) {
            headers.set("HX-Trigger", options.trigger);
        }
        if (options.triggerAfterSettle) {
            headers.set("HX-Trigger-After-Settle", options.triggerAfterSettle);
        }
        if (options.triggerAfterSwap) {
            headers.set("HX-Trigger-After-Swap", options.triggerAfterSwap);
        }
        if (options.redirect) {
            headers.set("HX-Redirect", options.redirect);
        }
        if (options.refresh) {
            headers.set("HX-Refresh", "true");
        }
        if (options.pushUrl) {
            headers.set("HX-Push-Url", options.pushUrl);
        }
        if (options.replaceUrl) {
            headers.set("HX-Replace-Url", options.replaceUrl);
        }

        return new Response(html, { headers, status: options.status || 200 });
    }

    /**
     * Create a response that signals client-side redirect
     */
    static redirectResponse(url: string): Response {
        return new Response(null, {
            headers: {
                "HX-Redirect": url,
            },
        });
    }

    /**
     * Create a response that triggers a full page refresh
     */
    static refreshResponse(): Response {
        return new Response(null, {
            headers: {
                "HX-Refresh": "true",
            },
        });
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

        // CSS link
        metaTags += `<link rel="stylesheet" href="/styles.css" />\n    `;

        // HTMX script from CDN
        metaTags += `<script src="https://unpkg.com/htmx.org@1.9.10" integrity="sha384-D1Kt99CQMDuVetoL1lrYwg5t+9QdHe7NLX/SoJYkXDFfX37iInKRy5xLSi8nO7UC" crossorigin="anonymous"></script>\n    `;

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
  <body hx-boost="true">
    <div id="root">
      ${html}
    </div>
    ${config?.dev ? getLiveReloadScript() : ""}
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

export interface HTMXResponseOptions {
    /** CSS selector to retarget the response to */
    retarget?: string;
    /** Swap method: innerHTML, outerHTML, beforeend, afterend, etc */
    reswap?: string;
    /** JSON string or event name to trigger on client */
    trigger?: string;
    /** Event to trigger after content settles */
    triggerAfterSettle?: string;
    /** Event to trigger after swap */
    triggerAfterSwap?: string;
    /** URL to redirect client to */
    redirect?: string;
    /** Whether to trigger a full page refresh */
    refresh?: boolean;
    /** URL to push into browser history */
    pushUrl?: string;
    /** URL to replace in browser history */
    replaceUrl?: string;
    /** HTTP status code */
    status?: number;
}
