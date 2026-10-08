import { Spec } from './schema';
import { normalize } from './normalize';
import { segment } from './segment';
import { checkRateLimit } from './ratelimit';
import { getMode, getEnv } from './env';
import { GeminiClient, GeminiError } from './gemini';
import { fallbackSpec, FallbackReason } from './fallback';
import { buildPrompt } from './prompt';
import { verifyProvenance } from './provenance';
import { checkIntegrity } from './integrity';

export interface PipelineResult {
  spec: Spec;
  mode: 'gemini' | 'demo' | 'fallback';
  warnings: string[];
  metrics: {
    latency: number;
    verifiedEvidence: number;
    droppedEvidence: number;
    modelUsed?: string;
  };
}

export async function runPipeline(transcript: string, ip: string): Promise<PipelineResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  if (!checkRateLimit(ip)) {
    throw new Error('Rate limit exceeded');
  }

  if (transcript.length < 10) {
    throw new Error('Transcript too short');
  }

  const cleaned = normalize(transcript);
  const sentences = segment(cleaned);
  let spec: Spec;
  let mode: 'gemini' | 'demo' | 'fallback' = 'gemini';
  let modelUsed: string | undefined = undefined;

  const opMode = getMode();
  if (opMode === 'demo') {
    mode = 'demo';
    const env = getEnv();
    const isMissingKey = !env.GEMINI_API_KEY || env.GEMINI_API_KEY.trim() === '';
    const fallback = fallbackSpec(sentences, isMissingKey ? 'no-key' : 'unknown');
    spec = fallback.spec;
    warnings.push(...fallback.warnings);
  } else {
    try {
      const client = new GeminiClient();
      const prompt = buildPrompt(sentences);
      const res = await client.generateSpec(prompt);
      spec = res.spec;
      modelUsed = res.modelUsed;
      const env = getEnv();
      if (modelUsed && env.GEMINI_FALLBACK_MODEL && modelUsed === env.GEMINI_FALLBACK_MODEL) {
        warnings.push('rate-limit');
      }
    } catch (err: unknown) {
      mode = 'fallback';
      let reason: FallbackReason = 'unknown';
      if (err instanceof Error && err.name === 'GeminiError') {
        reason = (err as GeminiError).reason;
      }
      const fallback = fallbackSpec(sentences, reason);
      spec = fallback.spec;
      warnings.push(...fallback.warnings);
    }
  }

  // Grounding
  const { verified, dropped } = verifyProvenance(spec, sentences);

  // Integrity
  const finalSpec = checkIntegrity(spec, warnings);

  const latency = Date.now() - startTime;

  return {
    spec: finalSpec,
    mode,
    warnings,
    metrics: {
      latency,
      verifiedEvidence: verified,
      droppedEvidence: dropped,
      modelUsed,
    },
  };
}
