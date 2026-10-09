/* eslint-disable */
import { execSync } from 'child_process';
import fs from 'fs';

try {
  console.log('Running Lighthouse on http://localhost:3000...');
  execSync(
    'npx -y lighthouse http://localhost:3000 --output json --output-path ./lh-report.json --chrome-flags="--headless" --preset=desktop',
    { stdio: 'inherit' },
  );

  const report = JSON.parse(fs.readFileSync('./lh-report.json', 'utf8'));
  const scores = {
    performance: report.categories.performance.score * 100,
    accessibility: report.categories.accessibility.score * 100,
    'best-practices': report.categories['best-practices'].score * 100,
    seo: report.categories.seo.score * 100,
  };

  console.log('Lighthouse Scores:', scores);

  const errors: string[] = [];
  if (scores.accessibility < 100)
    errors.push(`Accessibility: ${scores.accessibility} (expected 100)`);
  if (scores['best-practices'] < 100)
    errors.push(`Best Practices: ${scores['best-practices']} (expected 100)`);
  if (scores.seo < 100) errors.push(`SEO: ${scores.seo} (expected 100)`);
  if (scores.performance < 95) errors.push(`Performance: ${scores.performance} (expected >= 95)`);

  if (errors.length > 0) {
    console.error('Lighthouse audit failed constraints:', errors);
    process.exit(1);
  }

  console.log('Lighthouse audit passed all constraints.');
} catch (err) {
  console.error('Lighthouse run failed', err);
  process.exit(1);
}
