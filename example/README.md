# KilatJS Example

This example demonstrates how to use the published `kilatjs` npm package.

## Setup

1. Install dependencies:

```bash
cd example
bun install
```

2. Run development server:

```bash
bun run dev
```

3. Build for production:

```bash
bun run build
```

## What's Different

This example now imports from the published npm package:

- `import { defineConfig } from "kilatjs"` (instead of `../src/index`)
- `import { RouteContext } from "kilatjs"` (instead of `../../../src/core/types`)

## Standalone API Server

This example also includes a standalone API server demonstration in `server.ts`.

1. Run the API server:

```bash
bun server.ts
```

2. Access the API:

- Root: `http://localhost:4000/`
- Documentation: `http://localhost:4000/docs` (Automatic Swagger UI)

## Features Demonstrated

1. **Automatic Swagger Documentation**: Using the `swagger` middleware to generate interactive documentation.
2. **Typed Routes**: Using `RouteOptions` to provide metadata, request bodies, and response structures.
3. **Core API**: Using the lightweight `KilatJS` core for JSON-first services.
4. **Middleware**: Standard middleware stack (CORS, JWT, logging).

## Testing the Published Package

This setup allows you to verify that:

1. The published package exports work correctly
2. TypeScript types are properly included
3. The CLI commands work as expected
4. All features work the same as the local development version
