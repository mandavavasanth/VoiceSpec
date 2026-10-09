# VoiceSpec - Hackathon Submission

VoiceSpec is a Next.js application that converts dictated rambling into a structured product specification. Every generated item in the spec links directly to the transcript sentence it originated from.

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **AI Integration**: Google Gemini SDK (`@google/genai`)
- **Testing**: Vitest (Unit) & Playwright (E2E)
- **Validation**: Zod

## Repository Layout

- `app/`: Next.js App Router pages and layouts
- `components/`: Reusable React components (UI and specialized features)
- `lib/`: Core logic, state store, AI integrations, environment handling, and error types
- `tests/`: Vitest test suites covering parsing, state, routing, pipeline, and UI utilities
- `e2e/`: Playwright E2E tests for browser verification and accessibility
- `scripts/`: Assorted verification scripts for E2E health, model capabilities, Lighthouse, and CSP
- `docs/`: Visual references, screenshots, and architecture references

## Architecture and Pipeline

The application features a resilient generation pipeline hosted in a Next.js API route (`/api/generate`). It orchestrates a multi-step process:

1. **Normalization**: The raw dictated transcript is normalized and chunked into indexable sentences.
2. **Generation**: The sentences are passed to the Google Gemini API using a strict structured output prompt.
   - **Primary Model**: `gemini-3.6-flash` is used as the fast, default generation model.
   - **Fallback Model**: In the event of 503 capacity errors or 429 rate limits, it automatically retries with `gemini-3.8-flash`.
   - **Demo Mode**: If all live API attempts fail or quota is exhausted, the app gracefully degrades to a deterministic "Demo Mode".
3. **Streaming**: As Gemini yields progress, it is parsed and validated against a strict Zod schema, then streamed to the client via Stage Events.
4. **Validation & Grounding**: An integrity check verifies that all tasks, user stories, and requirements are grounded in the specific sentences from the transcript, producing the final provenance map.

## Hackathon Goals

The primary goal of VoiceSpec is to eliminate the friction between raw product discovery (dictation) and developer-ready action. By automatically extracting tasks, user stories, and acceptance criteria and linking them directly to the spoken transcript, VoiceSpec builds trust in the AI's output through absolute provenance.

## How to Run in Demo Mode

The application supports a fully local **Demo Mode** which bypasses the real AI model endpoints and mocks the generated output.

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server in demo mode:

   ```bash
   # Windows (CMD/PowerShell)
   set FORCE_DEMO_MODE=true && npm run dev

   # Linux/macOS
   FORCE_DEMO_MODE=true npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.
4. Click on **Use an example** to load the default voice transcript.
5. Click **Generate spec** to see the system compile the structure using the local mock data.

## Screenshots

Our design and functionality verifications can be viewed in the screenshots below:

- [Desktop View](./docs/desktop-view.png)
- [Mobile View](./docs/mobile-view.png)
- [Export Notification](./docs/export-toast.png)
- [Accessibility Focus](./docs/focus-state.png)

_Note: Ensure you are serving the application with production headers enabled if running the built variant (`npm run build` then `npm run start`)._
