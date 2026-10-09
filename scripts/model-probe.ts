/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-unused-vars */
import { loadEnvConfig } from '@next/env';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const projectDir = path.resolve(__dirname, '..');
loadEnvConfig(projectDir);

const isLive = process.argv.includes('--live');
if (!isLive) {
  console.log('Diagnostic scripts must not run without an explicit --live flag.');
  console.log('WARNING: Live runs use your daily API quota.');
  process.exit(1);
}
console.log('WARNING: This live run will consume your Gemini API quota.');

void (async () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('No GEMINI_API_KEY set.');
    return;
  }

  const ai = new GoogleGenAI({ apiKey: key });

  console.log('--- 1. AVAILABLE FLASH MODELS (via SDK) ---');
  let flashModels: any[] = [];
  try {
    const listRes = await ai.models.list();
    // Some versions of SDK return an array directly or an object with models array.
    // We'll handle both, or just fetch as a fallback if the structure is weird.
    const arr = Array.isArray(listRes) ? listRes : (listRes as any).models || listRes;

    // If it's an async iterator
    let models = [];
    if (Symbol.asyncIterator in Object(listRes)) {
      for await (const m of listRes as any) {
        models.push(m);
      }
    } else if (Array.isArray(arr)) {
      models = arr;
    } else {
      // Fallback to REST API if SDK list() shape is unknown
      const fetchRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      );
      const data = await fetchRes.json();
      models = data.models || [];
    }

    flashModels = models.filter((m: any) => (m.name || '').includes('flash'));
    for (const m of flashModels) {
      const supportsGen =
        Array.isArray(m.supportedGenerationMethods) &&
        m.supportedGenerationMethods.includes('generateContent');
      console.log(`- ${m.name}: supports generateContent: ${String(supportsGen)}`);
    }
  } catch (err) {
    console.error('Failed to list models via SDK:', err);
  }

  console.log('\n--- 2. TINY PROMPT TEST ---');
  const modelsToTest = [
    ...flashModels.map((m) => m.name.replace('models/', '')),
    'gemini-3.6-flash',
    'gemini-3.8-flash',
  ];

  for (const m of modelsToTest) {
    console.log(`\nTesting model: ${m}`);
    const start = Date.now();
    try {
      // Simple generateContent test
      const res = await ai.models.generateContent({
        model: m,
        contents: 'hello',
      });
      console.log(`Success! Latency: ${Date.now() - start}ms`);
    } catch (err: any) {
      const status = err.status || (err.response && err.response.status) || 'unknown';
      console.log(`Failed. HTTP Status: ${status}`);
      console.log(`Error message: ${err.message}`);
    }
  }

  console.log('\n--- 3. FULL PIPELINE TEST ON BEST MODEL ---');
  // Just pick the first flash model that supports generating content, or fallback to mainModel
  const bestModel =
    flashModels.find((m: any) => m.supportedGenerationMethods?.includes('generateContent'))?.name ||
    'models/gemini-3.6-flash';
  const bestModelClean = bestModel.replace('models/', '');

  console.log(`Selected best model: ${bestModelClean}`);

  await import('../lib/pipeline').then(async ({ runPipeline }) => {
    let transcript = '';
    try {
      const transcriptPath = path.join(projectDir, 'fixtures', 'sample-transcript.txt');
      transcript = fs.readFileSync(transcriptPath, 'utf8');
    } catch (e) {
      console.error('Failed to read fixture:', e);
      return;
    }

    const start = Date.now();
    try {
      const result = await runPipeline(transcript, '127.0.0.1');
      console.log(`Mode: ${result.mode}`);
      console.log(`Model Used: ${result.metrics.modelUsed}`);
      console.log(`Latency: ${result.metrics.latency}ms`);
      console.log(`Attempts: ${result.metrics.attempts || 1}`);

      if (result.mode === 'gemini') {
        console.log(`Verified Evidence: ${result.metrics.verifiedEvidence}`);
        console.log(`Dropped Evidence: ${result.metrics.droppedEvidence}`);

        console.log('Spec Items:');
        console.log(`  User Stories: ${result.spec.userStories.length || 0}`);
        console.log(`  Requirements: ${result.spec.requirements.length || 0}`);
        console.log(`  Acceptance Criteria: ${result.spec.acceptanceCriteria.length || 0}`);
        console.log(`  Risks: ${result.spec.risks.length || 0}`);
        console.log(`  Open Questions: ${result.spec.openQuestions.length || 0}`);
        console.log(`  Tasks: ${result.spec.tasks.length || 0}`);
      }

      console.log(`Warnings: ${JSON.stringify(result.warnings)}`);

      if (result.mode !== 'gemini') {
        const reason =
          result.warnings.find((w) => !w.includes('Fallback')) || result.warnings[0] || 'unknown';
        console.log(`Reason code: ${reason}`);
        console.log(`Status: Fallback`);
      }
    } catch (err) {
      console.error('Pipeline crashed:', err);
    }
  });

  console.log('\n--- 4. RECOMMENDATIONS ---');
  console.log('Based on the test above, you can see which model succeeded.');
  console.log(
    'You should configure GEMINI_MODEL to the best available flash model that returned a 200 Success.',
  );
  console.log(
    'You should configure GEMINI_FALLBACK_MODEL to the secondary flash model to gracefully handle 503 Overload or 429 Quota errors on the main model.',
  );
})();
