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

## Testing the Published Package

This setup allows you to verify that:
1. The published package exports work correctly
2. TypeScript types are properly included
3. The CLI commands work as expected
4. All features work the same as the local development version