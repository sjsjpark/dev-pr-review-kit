import { describe, expect, it } from 'vitest';
import { analyzeFiles } from '../src/analyzer.js';
import { assessReviewRisk, createSuggestedVerifications } from '../src/review-summary.js';

describe('review risk and suggestions', () => {
  it('raises risk for config + api changes without tests', () => {
    const analysis = analyzeFiles([
      'vite.config.ts',
      'src/api/userApi.ts',
      'src/components/Shared/Card.tsx',
    ]);

    const risk = assessReviewRisk(analysis);

    expect(risk.level).toBe('High');
    expect(risk.score).toBeGreaterThanOrEqual(4);
    expect(risk.reasons).toContain(
      'Configuration files changed; build and runtime behavior can be impacted.',
    );
  });

  it('returns low risk for style-only changes', () => {
    const analysis = analyzeFiles(['src/styles/reset.css']);

    const risk = assessReviewRisk(analysis);

    expect(risk.level).toBe('Low');
    expect(risk.reasons).toContain('Only style files changed; functional behavior risk is typically low.');
  });

  it('suggests verification commands based on analysis', () => {
    const analysis = analyzeFiles(['src/api/userApi.ts']);

    const suggestions = createSuggestedVerifications(analysis);

    expect(suggestions.map((item) => item.command)).toContain('npm run test');
    expect(suggestions.map((item) => item.command)).toContain('npm run build');
  });
});
