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

## M2

- Defined Zod schemas and inferred TypeScript types in `lib/schema.ts` matching the exact spec contract.
- Created `lib/normalize.ts` to strip filler words, false starts, and immediate repetitions.
- Created `lib/segment.ts` to cleanly sentence-split transcripts for provenance evidence.
- Built `lib/integrity.ts` to validate cross-references, eliminate cyclic dependencies, and remap all references (`requirementId`, `requirementIds`, `dependsOn`) when IDs are renumbered.
- Created `lib/fallback.ts` using deterministic cue-word classification, recording reason codes without raw text in warnings.
- Added realistic dictation fixture (`fixtures/sample-transcript.txt`) and matching mock spec.
- Implemented and passed all unit tests across schema, normalize, segment, integrity, and fallback.

## M3

- Built `lib/pipeline.ts` to orchestrate normalize, segment, rate limiting, LLM/fallback generation, grounding, and integrity checks.
- Implemented `/api/generate` route in Node runtime with `force-dynamic` and 30s max duration.
- Added strict payload size checking (~100KB) and streaming NDJSON responses.
- Fixed config file renames (`vitest.config.mts`, `commitlint.config.mjs`) and resolved lint/type errors.
- Fully resolved real Gemini call schema structure by providing a rigid object schema for the `@google/genai` SDK and appropriately mapped overload (503) and quota limits (429) to rate-limit or quota fallback.
- Added support for `GEMINI_FALLBACK_MODEL`, which automatically activates when the main model fails due to short-lived rate limits or 503s.
- Created schema consistency test to ensure Zod matches the hardcoded SDK schema.
- Verified pipeline locally with `test-gemini.ts` falling back securely to Demo mode on missing keys or exhausted retries.
- Implemented hard quota exhaustion detection (429 with specific messages), which immediately drops to demo mode with reason code `quota` without retrying or using fallback models. Diagnostic scripts now require `--live` flag and run safely without loops.

## M4: Input UI + Generation Flow + Stage Progress + Error/Retry

- Integrated `zustand` to centrally manage the transcript, generation mode, warnings, errors, and streamed response state.
- Generated `shadcn/ui` components (`button`, `badge`, `textarea`, `progress`, `alert`, `scroll-area`) to match the desired premium aesthetic seamlessly with Tailwind v4.
- Implemented `TranscriptPane` with accurate word and character counting (enforcing the 40-20k limits), along with Cmd/Ctrl+Enter submission and an empty state Example Loader.
- Added a `Toolbar` header containing the Generate button, validation limits display, and an animated Status Badge (Gemini vs Demo) complete with warning fallback reasoning.
- Configured secure Next.js HTTP response headers (CSP `unsafe-inline` for hydration, nosniff, referrer-policy) and verified via local production build tests.
- Wired page to the NDJSON generating route API. Stream parsing successfully handles JSON chunking constraints and accurately displays `currentStage` progressing live.

## M5: Spec UI, Interaction, and Exports

- Implemented `lib/evidence-index.ts` for bidirectional mapping between specification items and transcript sentences.
- Built `SpecPane` and `SectionCard` with inline editable text powered by `updateItemText` using a strict ID-prefix allowlist.
- Implemented highlight coordination logic prioritizing hover/focus, then pinned items.
- Added bidirectional scroll synchronization respecting reduced-motion settings, avoiding full page scrolls.
- Created standalone export functions (`lib/markdown.ts`, `lib/github-export.ts`) correctly escaping labels and using heredoc syntax with dynamic safe delimiters.
- Added export actions to `Toolbar.tsx` with copy and download functionalities wrapped in `sonner` toast notifications.
- Verified components are correctly separated into client directives without `dangerouslySetInnerHTML`.

## M6: Responsive, Accessibility, and E2E

- Implemented responsive mobile layout using an accessible Tab interface below 768px, ensuring the "Generate" action correctly switches focus to the Specification tab.
- Integrated accessibility standards: defined semantic landmarks (`<header>`, `<main>`, `<section>`), a single `h1` heading, a visible "Skip to content" link, and visible focus rings meeting contrast criteria.
- Ensured animations inside the Specification pane respect the `prefers-reduced-motion` media query using `motion-reduce` utilities.
- Converted Transcript pane sentences to a single tab stop, controllable entirely by arrow keys leveraging `aria-activedescendant` for proper screen reader announcement.
- Upgraded the E2E testing framework (`playwright`) configuring `FORCE_DEMO_MODE` dynamically across ports to bypass Gemini APIs strictly. Added a full CI/CD step ensuring UI stability on headless Chrome.
- Added a "Copy Agent Prompt" feature that transforms the current Spec into a deterministic prompt containing goals, tasks topologically sorted with a cycle-fallback, requirements, and instructions for an external coding agent.
