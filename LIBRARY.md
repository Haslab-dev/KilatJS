# KilatJS Library Usage Guide

This guide explains how to use KilatJS as a library in your own projects.

## Installation

```bash
bun add kilatjs
```

## Basic Usage

### Creating a Server

```typescript
import { createKilat } from 'kilatjs';

const server = createKilat({
    routesDir: './routes',
    port: 3000,
    dev: true
});

server.start();
```

### Configuration Options

```typescript
import { createKilat, KilatConfig } from 'kilatjs';

const config: Partial<KilatConfig> = {
    routesDir: './routes',
    outDir: './dist',
    port: 3000,
    hostname: 'localhost',
    dev: false,
    publicDir: './public',
    tailwind: {
        enabled: true,
        cssPath: './styles.css',
        inputPath: './input.css',
        configPath: './tailwind.config.js'
    }
};

const server = createKilat(config);
```

## Route Structure

Routes are files in your `routesDir` that follow these conventions:

### Page Routes

```typescript
// routes/index.tsx
export default function HomePage() {
    return <h1>Welcome to KilatJS!</h1>;
}
```

```typescript
// routes/about.tsx
export const meta = {
    title: 'About Us',
    description: 'Learn about our company'
};

export default function AboutPage() {
    return <div>About our company...</div>;
}
```

### Dynamic Routes

```typescript
// routes/posts/[id].tsx
export async function load({ params }: RouteContext) {
    const post = await getPost(params.id);
    return { post };
}

export default function PostPage({ data }: PageProps) {
    return <div>{data.post.title}</div>;
}
```

### API Routes

```typescript
// routes/api/users.ts
export async function GET() {
    const users = await getUsers();
    return Response.json(users);
}

export async function POST({ request }: RouteContext) {
    const user = await request.json();
    const created = await createUser(user);
    return Response.json(created, { status: 201 });
}
```

## UI Framework Support

### React (Default)

```typescript
// routes/example.tsx
import React from 'react';

export const ui = 'react';

export default function ExamplePage() {
    const [count, setCount] = React.useState(0);
    
    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(c => c + 1)}>Increment</button>
        </div>
    );
}
```

### HTMX

```typescript
// routes/example.tsx
export const ui = 'htmx';

export default function ExamplePage({ data }: PageProps) {
    return `
        <div>
            <p>Hello from HTMX!</p>
            <button hx-post="/api/click" hx-target="#result">
                Click me
            </button>
            <div id="result"></div>
        </div>
    `;
}
```

## Data Loading

### Server-side Data Loading

```typescript
// routes/dashboard.tsx
export async function load({ request }: RouteContext) {
    const user = await getUserFromRequest(request);
    const stats = await getUserStats(user.id);
    return { user, stats };
}

export default function Dashboard({ data }: PageProps) {
    return (
        <div>
            <h1>Welcome, {data.user.name}!</h1>
            <p>You have {data.stats.posts} posts</p>
        </div>
    );
}
```

### Static Generation

```typescript
// routes/blog/[slug].tsx
export const mode = 'static';

export function getStaticPaths() {
    return [
        '/blog/hello-world',
        '/blog/second-post',
        '/blog/third-post'
    ];
}

export async function load({ params }: RouteContext) {
    const post = await getPostBySlug(params.slug);
    return { post };
}

export default function BlogPost({ data }: PageProps) {
    return (
        <article>
            <h1>{data.post.title}</h1>
            <div>{data.post.content}</div>
        </article>
    );
}
```

## Form Handling

```typescript
// routes/contact.tsx
export async function POST({ request }: RouteContext) {
    const formData = await request.formData();
    const email = formData.get('email');
    const message = formData.get('message');
    
    await saveContact({ email, message });
    
    return Response.redirect('/contact/success', 302);
}

export default function ContactPage() {
    return (
        <form method="POST" action="/contact">
            <input type="email" name="email" required />
            <textarea name="message" required></textarea>
            <button type="submit">Send</button>
        </form>
    );
}
```

## Type Helpers

```typescript
import { defineLoader, defineConfig, defineMeta } from 'kilatjs';

// Type-safe loader
const loader = defineLoader(async (ctx: RouteContext) => {
    const data = await fetchData(ctx.params.id);
    return data;
});

// Type-safe configuration
const config = defineConfig({
    routesDir: './routes',
    port: 3000
});

// Type-safe meta
const meta = defineMeta({
    title: 'My Page',
    description: 'Page description'
});
```

## Building for Production

```typescript
import { buildStatic } from 'kilatjs';

await buildStatic({
    routesDir: './routes',
    outDir: './dist'
});
```

## Advanced Usage

### Custom Server

```typescript
import { KilatServer } from 'kilatjs';

const server = new KilatServer({
    routesDir: './routes',
    port: 3000,
    dev: false
});

await server.start();
```

### Using the Router Directly

```typescript
import { Router } from 'kilatjs';

const router = new Router({
    routesDir: './routes',
    port: 3000,
    dev: false
});

await router.loadRoutes();

const response = await router.handleRequest(request);
```

## TypeScript Support

KilatJS provides full TypeScript support with type definitions included. All the main interfaces are exported:

- `KilatConfig` - Configuration options
- `RouteContext` - Context passed to loaders and actions
- `PageProps` - Props passed to page components
- `RouteMeta` - SEO metadata configuration
- `RouteExports` - Type definition for route exports

## License

MIT License - see LICENSE file for details.