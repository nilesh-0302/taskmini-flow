# Vercel Deployment Issues — PrismaClient Debugging

## Problem 1

**Q: Why does the Vercel build fail with a module-not-found error during `prisma generate`?**

The `prisma.config.ts` file contains `import "dotenv/config"` at the top, but `dotenv` was not listed as a dependency in `package.json`. When Vercel runs the build — either via the `postinstall` hook (`prisma generate`) or the build script (`prisma generate && next build`) — the Prisma CLI loads `prisma.config.ts` using its TypeScript runtime. At that point Node.js throws `Cannot find module 'dotenv/config'`, which crashes `prisma generate` and halts the entire deployment.

**A (Implemented):** Added `dotenv` to `devDependencies` in `package.json`:

```json
"devDependencies": {
  "dotenv": "^16.0.0",
  ...
}
```

Run `npm install` locally after this change to update `package-lock.json` before pushing.

---

## Problem 2

**Q: Why does PrismaClient fail to initialize on Vercel even after generating the client successfully?**

The `prisma/schema.prisma` datasource block was missing the `url` field:

```prisma
// Before (broken)
datasource db {
  provider = "postgresql"
}
```

Prisma requires the `url` field to know which environment variable holds the connection string. Without it, Prisma cannot resolve the datasource during both the CLI operations and when it internally validates the schema. Even though `prisma.config.ts` provides a `datasource.url` override for CLI commands, the runtime PrismaClient (instantiated in `src/lib/prisma.ts`) relies on the generated schema metadata that maps `DATABASE_URL` to the datasource. The missing `url` field causes Prisma to skip this mapping, leading to a broken client on Vercel.

**A (Implemented):** Added `url = env("DATABASE_URL")` to the datasource block in `prisma/schema.prisma`:

```prisma
// After (fixed)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

---

## Problem 3

**Q: Why does the deployed app still fail to connect to the database at runtime even after fixing the schema?**

Even with the schema and dependency fixes above, the app will fail at runtime on Vercel if the `DATABASE_URL` environment variable is not configured in the Vercel project settings. The `.env` file is listed in `.gitignore` (`".env*"` pattern), so it is not pushed to GitHub and Vercel never sees it. Without the variable, `process.env.DATABASE_URL` is `undefined` at runtime, causing the `PrismaPg` adapter instantiation to fail.

**A (Manual step — not code):** Add `DATABASE_URL` in the Vercel dashboard:

1. Go to your project on [vercel.com](https://vercel.com)
2. Open **Settings → Environment Variables**
3. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: your full PostgreSQL connection string (same as the one in your local `.env`)
   - **Environment**: Production, Preview, Development (select all as needed)
4. **Redeploy** the project after saving the variable

---

## Problem 4

**Q: Why does GitHub Actions CI pass but Vercel deployment fail for the same code?**

GitHub Actions has `DATABASE_URL` configured as a repository secret (under **Settings → Secrets and variables → Actions**), so the build and `prisma generate` succeed in CI. Vercel runs its own independent build in a separate environment where those GitHub secrets are not available. Unless you explicitly set the same environment variable in the Vercel dashboard, Vercel builds with `DATABASE_URL` missing — causing a different failure mode than what CI sees.

**A:** There is no single environment that covers both CI and Vercel automatically. Secrets must be configured in both places:
- **GitHub Actions**: `Settings → Secrets → Actions → DATABASE_URL`
- **Vercel**: `Project Settings → Environment Variables → DATABASE_URL`

---

## Summary of Changes Made to the Codebase

| File | Change |
|------|--------|
| `package.json` | Added `"dotenv": "^16.0.0"` to `devDependencies` |
| `prisma/schema.prisma` | Added `url = env("DATABASE_URL")` to the `datasource db` block |
| `solution.md` | This file — documents all issues and fixes |

After applying these changes, run the following locally before pushing:

```bash
npm install
npx prisma generate
npm run build
```

Confirm the build succeeds locally, then push to trigger a fresh Vercel deployment with `DATABASE_URL` already set in the Vercel dashboard.
