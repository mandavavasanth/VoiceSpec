# VoiceSpec Voice Log

## M1

- Scaffolded Next.js App Router project with TypeScript and Tailwind CSS v4.
- Configured flat ESLint (`eslint.config.mjs`) with type-aware rules via `typescript-eslint`.
- Set up Prettier, Husky, lint-staged, and commitlint for pre-commit quality gates.
- Configured Vitest (with `passWithNoTests`) and Playwright (tests deferred to M6, running against prod build without API key).
- Created zod-validated environment config (`lib/env.ts`) handling `GEMINI_API_KEY`, `GEMINI_MODEL`, and `FORCE_DEMO_MODE`.
- Implemented `/api/health` endpoint returning status and current mode (gemini/demo).
- Created GitHub Actions CI workflow to run lint, typecheck, test, and build on push/PR.
- Verified all quality checks pass and app boots cleanly.
