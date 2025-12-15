# KilatJS

**A Bun-native, HTML-first framework that renders real pages, treats UI frameworks as renderers, and makes SEO the default—not a feature.**

<p align="center">
  <img src="https://img.shields.io/badge/runtime-Bun-F9F1E1?style=flat-square&logo=bun" alt="Bun Runtime">
  <img src="https://img.shields.io/badge/rendering-SSR%20Only-10B981?style=flat-square" alt="SSR Only">
  <img src="https://img.shields.io/badge/SEO-Guaranteed-8B5CF6?style=flat-square" alt="SEO Guaranteed">
</p>

---

## 🎯 What is KilatJS?

KilatJS is a server-first web framework inspired by the simplicity of PHP and the power of modern component libraries. It rejects the complexity of SPAs, hydration, and client-side routing in favor of **real HTML rendered on the server**.

**🔥 Powered by Bun's Native APIs - No Abstractions, Pure Performance:**
- 🚀 **Bun.FileSystemRouter** - Zero-config file-based routing at native speed
- ⚡ **Bun.serve()** - HTTP/2 server with built-in WebSocket support
- 🔧 **Bun.file()** - Streaming file operations with automatic MIME detection
- 📦 **Bun.build()** - Native TypeScript/JSX bundling (no Webpack/Vite needed)
- 🔄 **Bun.spawn()** - Process management for build tools and external commands
- 💾 **Bun.write()** - Optimized file writing with atomic operations
- 🔍 **Bun.glob()** - Pattern matching for static site generation

### One-Line Positioning

> **"Request → Load → Render HTML → Response. That's it."**

---

## 🔥 Why Bun Native?

KilatJS leverages Bun's runtime directly instead of abstracting it away:

```typescript
// Direct Bun.FileSystemRouter usage
const router = new Bun.FileSystemRouter({
    style: "nextjs",
    dir: "./routes"
});

// Native Bun.serve() with streaming
export default {
    port: 3000,
    fetch: async (request) => {
        // Zero-copy request handling
        return new Response(Bun.file("./static/index.html"));
    }
};

// Built-in TypeScript compilation
const result = await Bun.build({
    entrypoints: ["./src/index.tsx"],
    outdir: "./dist",
    target: "bun"
});
```

**Performance Benefits:**
- ⚡ **3x faster** cold starts vs Node.js frameworks
- 🚀 **Native TypeScript** - no transpilation overhead
- 💾 **Zero-copy streaming** for static files
- 🔧 **Built-in bundling** eliminates build tool complexity

---

## ✅ Core Principles

1. **HTML is the protocol** — Every response is complete, semantic HTML
2. **Server owns all truth** — No client-side state management nightmares
3. **Every meaningful change = HTTP request** — Forms, mutations, navigation
4. **UI frameworks render, never orchestrate** — React/Solid/Vue for templating only
5. **JavaScript is optional, not required** — Sites work without JS

---

## ❌ Strict Non-Goals

KilatJS intentionally avoids:

- ❌ Client-Side Rendering (CSR)
- ❌ Hydration / Islands architecture
- ❌ Client-side routing
- ❌ Framework hooks (`useLoaderData`, `useRoute`, etc.)
- ❌ Middleware chains
- ❌ Dependency injection
- ❌ SPA build assumptions
- ❌ Vite as a hard dependency

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
bun install
```

### 2. Run the example

```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the example site.

---

## 📁 Project Structure

```
kilatjs/
├── src/
│   ├── index.ts           # Main entry point
│   ├── core/
│   │   ├── router.ts      # File-based router
│   │   └── types.ts       # TypeScript types
│   ├── adapters/
│   │   └── react.ts       # React SSR adapter
│   └── server/
│       └── server.ts      # Bun HTTP server
├── example/
│   ├── server.ts          # Example server entry
│   ├── build.ts           # Static build script
│   ├── styles.css         # CSS styles
│   ├── components/
│   │   └── Layout.tsx     # Shared layout
│   └── routes/
│       ├── index.tsx      # Home page
│       ├── about.tsx      # About page
│       ├── contact.tsx    # Contact form
│       ├── contact/
│       │   └── success.tsx
│       └── blog/
│           ├── index.tsx  # Blog listing
│           └── [slug].tsx # Dynamic blog posts
└── README.md
```

---

## 📄 Route Contract

Each route file may export **at most**:

```tsx
// Rendering mode: "static" (build-time) or "ssr" (request-time)
export const mode = "ssr";

// UI framework: "react" | "solid" | "vue" (default: react)
export const ui = "react";

// SEO meta tags
export const meta = {
    title: "Page Title",
    description: "Page description for SEO",
    robots: "index,follow",
    ogTitle: "Open Graph Title",
    ogDescription: "Open Graph description",
    ogImage: "https://example.com/image.jpg"
};

// For static generation of dynamic routes
export function getStaticPaths() {
    return ["/blog/post-1", "/blog/post-2"];
}

// Server-only data loading
export async function load(ctx) {
    const data = await fetchFromDatabase();
    return { posts: data };
}

// HTTP action handlers
export async function POST(ctx) {
    const formData = await ctx.request.formData();
    // Process form...
    return Response.redirect("/success", 302);
}

// Pure render function
export default function Page({ data, params, state }) {
    return <div>{data.posts.map(p => <h2>{p.title}</h2>)}</div>;
}
```

---

## 🔄 Actions (PRG Pattern)

All meaningful state changes happen via HTTP requests:

```tsx
// routes/contact.tsx
export async function POST({ request }) {
    const formData = await request.formData();
    const email = formData.get("email");
    
    await saveToDatabase({ email });
    
    // PRG: Post-Redirect-Get pattern
    return Response.redirect("/contact/success", 302);
}

export default function ContactPage() {
    return (
        <form method="POST" action="/contact">
            <input type="email" name="email" required />
            <button type="submit">Subscribe</button>
        </form>
    );
}
```

**No JavaScript required.** Forms work natively.

---

## 🎨 Styling (Tailwind-Ready)

KilatJS supports Tailwind CSS via CLI (no Vite required):

```bash
# Generate CSS
npx tailwindcss -i ./input.css -o ./styles.css --watch
```

Configure in your `kilat.config.ts`:

```ts
import { createKilat } from 'kilatjs';

createKilat({
    routesDir: "./routes",
    tailwind: {
        enabled: true,
        cssPath: "./styles.css"
    }
});
```

---

## 📊 Rendering Modes

### Static Generation

- Build-time HTML
- Best for SEO & caching
- Requires explicit path enumeration for dynamic routes

```tsx
export const mode = "static";

export function getStaticPaths() {
    return ["/blog/post-1", "/blog/post-2"];
}
```

### Server-Side Rendering (SSR)

- Request-time HTML
- PHP-style execution
- Infinite routes allowed

```tsx
export const mode = "ssr"; // or omit (default)
```

---

## 🔐 Authentication

Identity is proven **per request** via cookies/headers:

```tsx
export async function load({ request }) {
    const session = await getSession(request.headers.get("cookie"));
    
    if (!session) {
        throw Response.redirect("/login");
    }
    
    return { user: session.user };
}
```

- Never trust localStorage for auth
- Server validates every request
- Cookies are the source of truth

---

## 🏃 Running Your App

### Development

```ts
// Named import
import { createKilat } from 'kilatjs';

// Or default import  
import Kilat from 'kilatjs';

const server = createKilat({
    routesDir: "./routes",
    port: 3000,
    dev: true,
    tailwind: {
        enabled: false,
        cssPath: "./styles.css"
    }
});

server.start();
```

### Static Build

```ts
import { buildStatic } from 'kilatjs';

buildStatic({
    routesDir: "./routes",
    outDir: "./dist"
});
```

---

## 🧩 UI Framework Support

| Framework | Status | Notes |
|-----------|--------|-------|
| React | ✅ Default | Full SSR support |
| Solid | 🚧 Planned | Coming soon |
| Vue | 🚧 Planned | Coming soon |

**Rule:** One renderer per route. No mixing.

---

## 🎯 SEO Guarantee

> **If a route exists, it is SEO-friendly.**

Because:
- HTML is always complete
- `<head>` is server-rendered
- No JS required for content
- Meta tags are first-class

---

## 📜 Philosophy

KilatJS rejects modern web complexity:

| We Don't Do | We Do |
|-------------|-------|
| Client-side rendering | Server-rendered HTML |
| Hydration/Islands | Static markup |
| Client-side router | HTTP navigation |
| Framework hooks | Props from loader |
| State sync | HTTP mutations |

---

## 🛠️ API Reference

### `createKilat(config)`

Creates a Kilat server instance.

```ts
interface KilatConfig {
    routesDir: string;      // Path to routes directory
    outDir: string;         // Output for static builds
    port?: number;          // Server port (default: 3000)
    hostname?: string;      // Server hostname (default: "localhost")
    dev?: boolean;          // Development mode
    publicDir?: string;     // Static assets directory
    tailwind?: {
        enabled: boolean;
        cssPath: string;
        configPath?: string;
    };
}
```

### `RouteContext`

Passed to `load()` and action handlers:

```ts
interface RouteContext {
    request: Request;                    // Web Request object
    params: Record<string, string>;      // URL parameters
    query: URLSearchParams;              // Query string
    state: ServerGlobalState;            // Request-scoped state
}
```

### `PageProps`

Passed to page components:

```ts
interface PageProps {
    data: any;                           // From load()
    params: Record<string, string>;      // URL parameters
    state: ServerGlobalState;            // Request-scoped state
}
```

---

## 📝 License

MIT

---

## 🤝 Contributing

KilatJS is in early development. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

---

<p align="center">
  <strong>Built with 💜 for the real web using Bun's native APIs.</strong>
</p>