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

### One-Line Positioning

> **"Request → Load → Render HTML → Response. That's it."**

---

## � *Quick Start

### Installation

```bash
# Create a new project
mkdir my-app && cd my-app
bun init

# Install KilatJS
bun add kilatjs react react-dom

# Install dev dependencies
bun add -d @types/react @types/react-dom typescript tailwindcss
```

### Create Your First App

**1. Create config file `kilat.config.ts`:**

```ts
import { defineConfig } from "kilatjs";

export default defineConfig({
    appDir: "./src",
    outDir: "./dist",
    port: 3000,
    tailwind: {
        enabled: true,
        inputPath: "./input.css",
        cssPath: "./styles.css",
    },
});
```

**2. Create input CSS `input.css`:**

```css
@import "tailwindcss";
```

**3. Create your first route `src/routes/index.tsx`:**

```tsx
export const meta = {
    title: "Welcome to KilatJS",
    description: "A Bun-native, HTML-first framework",
};

export async function load() {
    return {
        message: "Hello from the server!",
        time: new Date().toLocaleTimeString(),
    };
}

export default function HomePage({ data }) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-3xl font-bold text-gray-900">{data.message}</h1>
                <p className="text-gray-600 mt-2">Server time: {data.time}</p>
            </div>
        </div>
    );
}
```

**4. Run the dev server:**

```bash
bunx kilat dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

---

## 📖 CLI Commands

| Command | Description |
|---------|-------------|
| `kilat dev` | Start development server with HMR + Live Reload |
| `kilat build` | Build for production |
| `kilat serve` | Run production server (`bun dist/server.js`) |
| `kilat preview` | Preview static files |

### Development Output

```
⚡ KilatJS Dev Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ➜ http://localhost:3000
  ➜ HMR + Live Reload enabled
  ➜ Edit files and see changes instantly
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Build Output

```
🔨 KilatJS Production Build

🎨 Building Tailwind CSS...

📄 Routes Analysis:
─────────────────────────────────────────────────────────
   📄 /                    SSR          index.tsx
   📄 /about               SSR          about.tsx
   ⚡ /api/posts           API          api/posts.ts
   🔄 /blog/[slug]         Dynamic SSR  blog/[slug].tsx
─────────────────────────────────────────────────────────
   Total: 15 routes (10 SSR, 3 Dynamic, 2 API)

✅ Build Complete!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Output: ./dist
   Start: bun ./dist/server.js
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 📁 Project Structure

```
my-app/
├── kilat.config.ts        # Configuration
├── input.css              # Tailwind input
├── styles.css             # Generated CSS
├── src/
│   ├── components/        # Shared components
│   │   └── Layout.tsx
│   └── routes/            # File-based routing
│       ├── index.tsx      # → /
│       ├── about.tsx      # → /about
│       ├── blog/
│       │   ├── index.tsx  # → /blog
│       │   └── [slug].tsx # → /blog/:slug
│       └── api/
│           └── posts.ts   # → /api/posts
└── dist/                  # Production build
```

---

## 📄 Route Contract

Each route file can export:

```tsx
// SEO meta tags
export const meta = {
    title: "Page Title",
    description: "Page description",
    robots: "index,follow",
    ogTitle: "Open Graph Title",
    ogDescription: "OG description",
    ogImage: "https://example.com/image.jpg",
};

// Server-side data loading
export async function load(ctx) {
    const data = await fetchData();
    return { items: data };
}

// HTTP method handlers (POST, PUT, DELETE, etc.)
export async function POST(ctx) {
    const formData = await ctx.request.formData();
    // Process form...
    return Response.redirect("/success", 302);
}

// Page component (receives data from load())
export default function Page({ data, params, state }) {
    return <div>{data.items.map(item => <p>{item.name}</p>)}</div>;
}
```

---

## 🔧 Tutorial: Building a Blog

### Step 1: Create Layout Component

**`src/components/Layout.tsx`:**

```tsx
interface LayoutProps {
    children: React.ReactNode;
    title?: string;
}

export function Layout({ children, title = "My Blog" }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <nav className="max-w-4xl mx-auto px-4 py-4">
                    <a href="/" className="text-xl font-bold">My Blog</a>
                    <div className="float-right space-x-4">
                        <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                        <a href="/blog" className="text-gray-600 hover:text-gray-900">Blog</a>
                        <a href="/about" className="text-gray-600 hover:text-gray-900">About</a>
                    </div>
                </nav>
            </header>
            <main className="max-w-4xl mx-auto px-4 py-8">
                {children}
            </main>
        </div>
    );
}
```

### Step 2: Create Blog List Page

**`src/routes/blog/index.tsx`:**

```tsx
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Blog - My Site",
    description: "Read our latest articles",
};

export async function load() {
    // In real app, fetch from database
    const posts = [
        { id: 1, slug: "hello-world", title: "Hello World", excerpt: "My first post..." },
        { id: 2, slug: "getting-started", title: "Getting Started", excerpt: "Learn how to..." },
    ];
    return { posts };
}

export default function BlogPage({ data }) {
    return (
        <Layout>
            <h1 className="text-3xl font-bold mb-8">Blog</h1>
            <div className="space-y-6">
                {data.posts.map(post => (
                    <article key={post.id} className="bg-white p-6 rounded-lg shadow">
                        <h2 className="text-xl font-semibold">
                            <a href={`/blog/${post.slug}`} className="hover:text-blue-600">
                                {post.title}
                            </a>
                        </h2>
                        <p className="text-gray-600 mt-2">{post.excerpt}</p>
                    </article>
                ))}
            </div>
        </Layout>
    );
}
```

### Step 3: Create Dynamic Blog Post Page

**`src/routes/blog/[slug].tsx`:**

```tsx
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Blog Post",
    description: "Read this article",
};

export async function load({ params }) {
    // params.slug contains the URL parameter
    const post = await getPostBySlug(params.slug);
    
    if (!post) {
        throw new Response("Not Found", { status: 404 });
    }
    
    return { post };
}

async function getPostBySlug(slug: string) {
    // In real app, fetch from database
    const posts = {
        "hello-world": { title: "Hello World", content: "This is my first post!" },
        "getting-started": { title: "Getting Started", content: "Let me show you how..." },
    };
    return posts[slug] || null;
}

export default function BlogPostPage({ data, params }) {
    return (
        <Layout>
            <article>
                <h1 className="text-4xl font-bold mb-4">{data.post.title}</h1>
                <div className="prose max-w-none">
                    {data.post.content}
                </div>
            </article>
            <a href="/blog" className="text-blue-600 mt-8 inline-block">← Back to Blog</a>
        </Layout>
    );
}
```

### Step 4: Create API Route

**`src/routes/api/posts.ts`:**

```ts
import { RouteContext } from "kilatjs";

const posts = [
    { id: 1, title: "Hello World", slug: "hello-world" },
    { id: 2, title: "Getting Started", slug: "getting-started" },
];

// GET /api/posts
export async function GET(ctx: RouteContext) {
    const search = ctx.query.get("search")?.toLowerCase();
    
    let results = posts;
    if (search) {
        results = posts.filter(p => p.title.toLowerCase().includes(search));
    }
    
    return new Response(JSON.stringify({ data: results }), {
        headers: { "Content-Type": "application/json" },
    });
}

// POST /api/posts
export async function POST(ctx: RouteContext) {
    const body = await ctx.request.json();
    
    const newPost = {
        id: posts.length + 1,
        title: body.title,
        slug: body.title.toLowerCase().replace(/\s+/g, "-"),
    };
    
    posts.push(newPost);
    
    return new Response(JSON.stringify({ data: newPost }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
    });
}
```

### Step 5: Create Contact Form with PRG Pattern

**`src/routes/contact.tsx`:**

```tsx
import { Layout } from "../components/Layout";

export const meta = {
    title: "Contact Us",
    description: "Get in touch with us",
};

// Handle form submission
export async function POST({ request }) {
    const formData = await request.formData();
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    
    // Save to database, send email, etc.
    console.log("Contact form:", { name, email, message });
    
    // PRG: Post-Redirect-Get pattern
    return Response.redirect("/contact/success", 302);
}

export default function ContactPage() {
    return (
        <Layout>
            <h1 className="text-3xl font-bold mb-8">Contact Us</h1>
            <form method="POST" className="max-w-md space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <input 
                        type="text" 
                        name="name" 
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input 
                        type="email" 
                        name="email" 
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <textarea 
                        name="message" 
                        rows={4}
                        required
                        className="w-full px-3 py-2 border rounded-lg"
                    />
                </div>
                <button 
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                >
                    Send Message
                </button>
            </form>
        </Layout>
    );
}
```

**`src/routes/contact/success.tsx`:**

```tsx
import { Layout } from "../../components/Layout";

export const meta = {
    title: "Message Sent",
};

export default function ContactSuccessPage() {
    return (
        <Layout>
            <div className="text-center py-12">
                <h1 className="text-3xl font-bold text-green-600 mb-4">✓ Message Sent!</h1>
                <p className="text-gray-600 mb-8">Thank you for contacting us. We'll get back to you soon.</p>
                <a href="/" className="text-blue-600 hover:underline">← Back to Home</a>
            </div>
        </Layout>
    );
}
```

---

## 🔐 Authentication Example

```tsx
// src/routes/dashboard.tsx
export async function load({ request }) {
    const cookie = request.headers.get("cookie");
    const session = await getSession(cookie);
    
    if (!session) {
        // Redirect to login if not authenticated
        throw Response.redirect("/login", 302);
    }
    
    return { user: session.user };
}

export default function DashboardPage({ data }) {
    return (
        <div>
            <h1>Welcome, {data.user.name}!</h1>
            <form method="POST" action="/logout">
                <button type="submit">Logout</button>
            </form>
        </div>
    );
}
```

---

## 🛠️ Configuration Reference

```ts
// kilat.config.ts
import { defineConfig } from "kilatjs";

export default defineConfig({
    appDir: "./src",           // Source directory (auto-detects routes/ or pages/)
    outDir: "./dist",          // Production build output
    port: 3000,                // Server port
    hostname: "localhost",     // Server hostname
    publicDir: "./public",     // Static assets directory
    tailwind: {
        enabled: true,         // Enable Tailwind CSS
        inputPath: "./input.css",
        cssPath: "./styles.css",
    },
});
```

---

## 🔥 Why Bun Native?

KilatJS leverages Bun's runtime directly:

- ⚡ **Bun.FileSystemRouter** - Zero-config file-based routing
- 🚀 **Bun.serve()** - HTTP server with WebSocket support
- 📦 **Bun.build()** - Native TypeScript/JSX bundling
- 💾 **Bun.file()** - Streaming file operations
- 🔍 **Bun.Glob** - Pattern matching for routes

**Performance:**
- 3x faster cold starts vs Node.js
- Native TypeScript - no transpilation
- Zero-copy streaming for static files

---

## ✅ Core Principles

1. **HTML is the protocol** — Every response is complete, semantic HTML
2. **Server owns all truth** — No client-side state management
3. **Every change = HTTP request** — Forms, mutations, navigation
4. **UI frameworks render only** — React for templating, not orchestration
5. **JavaScript is optional** — Sites work without JS

---

## ⚡ Client-Side Interactivity

KilatJS is server-first, but you can add client-side interactivity using these patterns:

### 1. `clientScript` Export (Recommended)

Export a function that runs in the browser. TypeScript/LSP fully supports it!

```tsx
// src/routes/counter.tsx

// Client-side script - auto-injected, LSP checks the code!
export function clientScript() {
    let count = 0;
    const countEl = document.getElementById("count")!;
    
    document.getElementById("decrement")!.onclick = () => {
        countEl.textContent = String(--count);
    };
    document.getElementById("increment")!.onclick = () => {
        countEl.textContent = String(++count);
    };
}

export default function CounterPage() {
    return (
        <div>
            <button id="decrement">-</button>
            <span id="count">0</span>
            <button id="increment">+</button>
        </div>
    );
}
```

The framework automatically injects the script - no manual `<script>` tags needed!

### 2. Alpine.js

Lightweight reactivity with declarative HTML attributes:

```tsx
export default function AlpinePage() {
    return (
        <div x-data="{ count: 0 }">
            <button x-on:click="count--">-</button>
            <span x-text="count">0</span>
            <button x-on:click="count++">+</button>
        </div>
    );
}
```

### 3. HTMX

Server-driven UI updates without JavaScript:

```html
<!-- Can use .html files directly in routes/ -->
<button 
    hx-get="/api/greeting"
    hx-target="#result"
    hx-swap="innerHTML">
    Load
</button>
<div id="result"></div>
```

KilatJS supports `.html` files as routes - perfect for HTMX pages!

### 4. Native HTML Forms

Best for mutations - no JS required:

```tsx
<form method="POST" action="/contact">
    <input name="email" type="email" />
    <button type="submit">Submit</button>
</form>
```

---

## ❌ What KilatJS Doesn't Do

- ❌ Client-Side Rendering (CSR)
- ❌ React Hydration / Islands
- ❌ Client-side routing
- ❌ React hooks (`useState`, `useEffect`) - No client React runtime
- ❌ SPA patterns

### Why No React Hooks?

KilatJS uses `renderToStaticMarkup` which outputs pure HTML without React runtime. This means:

- ✅ Faster page loads (no React bundle)
- ✅ Better SEO (real HTML)
- ✅ Works without JavaScript
- ❌ No `useState`, `useEffect`, `onClick`

**For interactivity, use `clientScript`, Alpine.js, HTMX, or vanilla JS instead.**

> If you need React hooks with SSR, consider Next.js or Remix which have built-in hydration.

---

## 📝 License

MIT

---

<p align="center">
  <strong>Built with 💜 for the real web using Bun.</strong>
</p>
