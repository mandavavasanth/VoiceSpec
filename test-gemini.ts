import { runPipeline } from './lib/pipeline';

async function main() {
  console.log('Testing real Gemini call...');
  const transcript = `
    Um, let me think.
    I need a user to log in so that they can see their dashboard.
    Also, the app must respond within 500 milliseconds.
    I'm a bit worried that the database might get overloaded.
    Can we check if Redis is already installed?
  `;

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
    }
  }
}

void main();
