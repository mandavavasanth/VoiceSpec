import { loadEnvConfig } from '@next/env';
import fs from 'fs';
import path from 'path';

// Load env files the way Next.js does
const projectDir = path.resolve(__dirname, '..');
loadEnvConfig(projectDir);

// Dynamic import so env is loaded before modules are evaluated
void (async () => {
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

          let attempt = 0;
          let success = false;

          while (attempt < 3 && !success) {
            attempt++;
            console.log(`\nAttempt ${String(attempt)}...`);
            try {
              const result = await runPipeline(transcript, '127.0.0.1');
              if (result.mode === 'gemini') {
                success = true;
                console.log('Mode:', result.mode);
                console.log('Model Used:', result.metrics.modelUsed);
                console.log('Latency:', result.metrics.latency, 'ms');
                console.log('Verified Evidence:', result.metrics.verifiedEvidence);
                console.log('Dropped Evidence:', result.metrics.droppedEvidence);
                if (result.warnings.length > 0) {
                  console.log('Warnings:', result.warnings);
                }
              } else {
                console.log('Failed. Mode:', result.mode, 'Warnings:', result.warnings);
                if (result.warnings.some((w) => w.includes('rate-limit')) && attempt < 3) {
                  console.log('Waiting 2 minutes before retry...');
                  await new Promise((resolve) => setTimeout(resolve, 120000));
                }
              }
            } catch (err: unknown) {
              console.error('Unknown error:', err);
            }
          }

          if (!success) {
            console.log('\nAll 3 tries failed.');
            console.log('Fallback model name to use: gemini-2.5-flash');
          }
        }

        void main();
      });
    });
  });
})();
