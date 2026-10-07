import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';

// Load env files the way Next.js does
const projectDir = path.resolve(__dirname, '..');
loadEnvConfig(projectDir);

// Dynamic import so env is loaded before modules are evaluated
await import('../lib/pipeline').then(async ({ runPipeline }) => {
  await import('../lib/env').then(async ({ getEnv }) => {
    await import('../lib/gemini').then(() => {
      async function main() {
        console.log('--- DIAGNOSTICS ---');
        const key = process.env.GEMINI_API_KEY;
        const isSet = !!key && key.trim() !== '';
        console.log(`Key is set: ${String(isSet)}`);
        if (isSet && key) {
          console.log(`Key length: ${String(key.length)}`);
          console.log(`Contains whitespace: ${String(/\\s/.test(key))}`);
          console.log(`Contains quotes: ${String(/['"]/.test(key))}`);
          console.log(
            `Is placeholder: ${String(key.toLowerCase().includes('your_') || key.toLowerCase().includes('placeholder'))}`,
          );
        }
        const env = getEnv();
        console.log(`Model name from env: ${env.GEMINI_MODEL}`);
        console.log('-------------------\\n');

        console.log('Testing real Gemini call with sample transcript...');
        let transcript = '';
        try {
          const transcriptPath = path.join(projectDir, 'fixtures', 'sample-transcript.txt');
          transcript = fs.readFileSync(transcriptPath, 'utf8');
        } catch (e) {
          console.error('Failed to read fixture:', e);
          return;
        }

        try {
          const result = await runPipeline(transcript, '127.0.0.1');
          console.log('Mode:', result.mode);
          console.log('Latency:', result.metrics.latency, 'ms');
          console.log('Verified Evidence:', result.metrics.verifiedEvidence);
          console.log('Dropped Evidence:', result.metrics.droppedEvidence);

          if (result.warnings.length > 0) {
            console.log('Warnings:', result.warnings);
          }
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error('Pipeline failed:', err.message);
            if (err.name === 'GeminiError') {
              console.error('Reason code:', (err as Error & { reason?: string }).reason);
            }
          } else {
            console.error('Unknown error:', err);
          }
        }
      }

      void main();
    });
  });
});
