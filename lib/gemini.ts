import { GoogleGenAI } from '@google/genai';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Spec, SpecSchema } from './schema';
import { getEnv, isGeminiAvailable } from './env';
import { FallbackReason } from './fallback';

export interface IGeminiClient {
  generateSpec(prompt: string): Promise<Spec>;
}

export class GeminiError extends Error {
  constructor(
    public reason: FallbackReason,
    message: string,
  ) {
    super(message);
    this.name = 'GeminiError';
  }
}

// Strip unsupported keywords for Gemini API
function loosenSchema(schema: unknown): unknown {
  const result = Array.isArray(schema) ? [] : {};
  for (const key in schema as Record<string, unknown>) {
    if (key === 'pattern' || key === 'format') {
      continue;
    }
    const val = (schema as Record<string, unknown>)[key];
    if (val && typeof val === 'object') {
      (result as Record<string, unknown>)[key] = loosenSchema(val);
    } else {
      (result as Record<string, unknown>)[key] = val;
    }
  }
  return result;
}

const GLOBAL_DEADLINE_MS = 25000;
const ATTEMPT_TIMEOUT_MS = 10000;

export class GeminiClient implements IGeminiClient {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const env = getEnv();
    if (!isGeminiAvailable()) {
      throw new GeminiError('auth', 'Gemini API not available (demo mode or missing key)');
    }
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.modelName = env.GEMINI_MODEL;
  }

  async generateSpec(prompt: string): Promise<Spec> {
    const startTime = Date.now();
    let attempt = 0;
    let lastErrorReason: FallbackReason = 'unknown';

    // Build loosened schema
    const rawSchema = zodToJsonSchema(SpecSchema as never, { target: 'jsonSchema7' });
    const jsonSchema = loosenSchema(rawSchema) as Record<string, unknown>;
    // Delete top-level defs if they exist, to simplify for the API
    if (jsonSchema['definitions']) delete jsonSchema['definitions'];
    if (jsonSchema['$schema']) delete jsonSchema['$schema'];

    const config = {
      responseMimeType: 'application/json',
      responseSchema: jsonSchema,
      maxOutputTokens: 8192,
      temperature: 0.2, // Low temp for more deterministic parsing
    };

    const runAttempt = async (currentPrompt: string): Promise<string> => {
      const abortController = new AbortController();

      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          abortController.abort();
          reject(new GeminiError('timeout', 'Request timed out'));
        }, ATTEMPT_TIMEOUT_MS);
      });

      try {
        const response = await Promise.race([
          this.ai.models.generateContent({
            model: this.modelName,
            contents: currentPrompt,
            // @ts-expect-error SDK may not have thinkingConfig yet
            config,
          }),
          timeoutPromise,
        ]);

        if (!response.text) {
          throw new Error('Empty response from model');
        }
        return response.text;
      } catch (err: unknown) {
        if (
          err instanceof Error &&
          err.name === 'GeminiError' &&
          (err as GeminiError).reason === 'timeout'
        ) {
          throw err;
        }

        // Check rate limit / auth / server errors
        const errorObj = err as Record<string, unknown>;
        const status =
          errorObj['status'] ||
          (errorObj['response'] as Record<string, unknown> | undefined)?.['status'];
        const message = err instanceof Error ? err.message.toLowerCase() : '';
        if (status === 401 || status === 403 || message.includes('api key not valid'))
          throw new GeminiError('auth', 'Authentication failed');
        if (status === 429) throw new GeminiError('rate-limit', 'Rate limited');

        throw err;
      }
    };

    while (Date.now() - startTime < GLOBAL_DEADLINE_MS) {
      attempt++;
      try {
        const rawJson = await runAttempt(prompt);
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawJson);
        } catch {
          // If JSON parse fails, throw schema error (which triggers repair if attempt 1)
          throw new GeminiError('schema', 'Invalid JSON returned');
        }

        const validation = SpecSchema.safeParse(parsed);
        if (validation.success) {
          return validation.data;
        } else {
          // Zod validation failed
          if (attempt === 1) {
            // REPAIR CALL: feed the error back
            prompt = `${prompt}\n\n<SYSTEM>\nThe previous JSON failed validation. Errors: ${validation.error.message}\nPlease output a corrected JSON.</SYSTEM>`;
            throw new GeminiError('schema', 'Schema validation failed, attempting repair');
          }
          throw new GeminiError('schema', 'Schema validation failed after repair');
        }
      } catch (err: unknown) {
        // If it's a known GeminiError, record reason
        if (err instanceof Error && err.name === 'GeminiError') {
          const geminiErr = err as GeminiError;
          lastErrorReason = geminiErr.reason;
          if (geminiErr.reason === 'auth') throw err; // Don't retry auth
          if (geminiErr.reason === 'schema' && attempt >= 2) throw err; // Only 1 repair attempt
        } else {
          lastErrorReason = 'unknown';
        }

        // Check if we have time for retry
        const elapsed = Date.now() - startTime;
        if (elapsed >= GLOBAL_DEADLINE_MS) {
          throw new GeminiError(lastErrorReason, 'Global deadline exceeded');
        }

        // Exponential backoff + jitter for 429 / 5xx
        if (lastErrorReason === 'rate-limit' || lastErrorReason === 'unknown') {
          if (attempt > 2) throw new GeminiError(lastErrorReason, 'Max retries exceeded');
          const delay = Math.pow(2, attempt) * 500 + Math.random() * 200;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new GeminiError(lastErrorReason, 'Global deadline exceeded');
  }
}
