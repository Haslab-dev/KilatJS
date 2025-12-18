# Publishing to npm

## Prerequisites

- Bun installed
- npm account ([npmjs.com](https://www.npmjs.com))

## Steps

```bash
# 1. Login to npm
bunx npm login

# 2. Bump version (choose one)
bunx npm version patch   # 0.1.4 → 0.1.5
bunx npm version minor   # 0.1.4 → 0.2.0
bunx npm version major   # 0.1.4 → 1.0.0

# 3. Dry run (optional but recommended)
bunx npm publish --dry-run

# 4. Publish
bunx npm publish
```

## Notes

- `bun run build` runs automatically before publish via `prepublishOnly`
- Published files: `dist/**/*`, `README.md`, `LICENSE`
