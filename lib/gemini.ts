import { GoogleGenAI, Type, Schema } from '@google/genai';
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

    const evidenceSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          sentenceIndex: { type: Type.INTEGER },
          quote: { type: Type.STRING },
        },
        required: ['sentenceIndex', 'quote'],
      },
    };

    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          problem: { type: Type.STRING },
          userStories: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                persona: { type: Type.STRING },
                want: { type: Type.STRING },
                soThat: { type: Type.STRING },
                evidence: evidenceSchema,
              },
              required: ['id', 'persona', 'want', 'soThat', 'evidence'],
            },
          },
          requirements: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                priority: { type: Type.STRING },
                evidence: evidenceSchema,
              },
              required: ['id', 'text', 'priority', 'evidence'],
            },
          },
          acceptanceCriteria: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                requirementId: { type: Type.STRING },
                given: { type: Type.STRING },
                when: { type: Type.STRING },
                then: { type: Type.STRING },
              },
              required: ['id', 'requirementId', 'given', 'when', 'then'],
            },
          },
          risks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                severity: { type: Type.STRING },
                evidence: evidenceSchema,
              },
              required: ['id', 'text', 'severity', 'evidence'],
            },
          },
          openQuestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                reason: { type: Type.STRING },
                evidence: evidenceSchema,
              },
              required: ['id', 'question', 'reason', 'evidence'],
            },
          },
          tasks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                priority: { type: Type.STRING },
                size: { type: Type.STRING },
                requirementIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                dependsOn: { type: Type.ARRAY, items: { type: Type.STRING } },
                evidence: evidenceSchema,
              },
              required: [
                'id',
                'title',
                'description',
                'priority',
                'size',
                'requirementIds',
                'dependsOn',
                'evidence',
              ],
            },
          },
        },
        required: [
          'title',
          'summary',
          'problem',
          'userStories',
          'requirements',
          'acceptanceCriteria',
          'risks',
          'openQuestions',
          'tasks',
        ],
      } as Schema,
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

        console.log('DEBUG RAW ERR:', err);
        // Check rate limit / auth / server errors
        const errorObj = err as Record<string, unknown>;
        const status =
          errorObj['status'] ||
          (errorObj['response'] as Record<string, unknown> | undefined)?.['status'];
        const message = err instanceof Error ? err.message.toLowerCase() : '';
        if (status === 401 || status === 403 || message.includes('api key not valid'))
          throw new GeminiError('auth', 'Authentication failed');
        if (status === 429 || status === 503) {
          throw new GeminiError('rate-limit', 'Rate limited or high demand');
        }

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
          console.error('ZOD ERROR:', validation.error.message);
          console.error('RAW JSON THAT FAILED:', rawJson);
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
