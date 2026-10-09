import * as z from 'zod';

/**
 * Environment configuration validated with zod.
 * The app runs in demo mode when GEMINI_API_KEY is absent or empty,
 * or when FORCE_DEMO_MODE is set to 'true'.
 *
 * IMPORTANT: Never log or print the API key.
 */

const envSchema = z.object({
  GEMINI_API_KEY: z
    .string()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  GEMINI_FALLBACK_MODEL: z.string().optional(),
  FORCE_DEMO_MODE: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;
  _env = envSchema.parse({
    GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
    GEMINI_MODEL: process.env['GEMINI_MODEL'],
    FORCE_DEMO_MODE: process.env['FORCE_DEMO_MODE'],
  });
  return _env;
}

/**
 * Whether Gemini is available for real API calls.
 * Returns false if FORCE_DEMO_MODE is set or no API key is configured.
 */
export function isGeminiAvailable(): boolean {
  const env = getEnv();
  return !env.FORCE_DEMO_MODE && !!env.GEMINI_API_KEY;
}

/**
 * Returns the current operating mode: 'gemini' if real API is available, 'demo' otherwise.
 */
export function getMode(): 'gemini' | 'demo' {
  return isGeminiAvailable() ? 'gemini' : 'demo';
}

/**
 * Reset cached env (useful for testing).
 */
export function resetEnv(): void {
  _env = null;
}
