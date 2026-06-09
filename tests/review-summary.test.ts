import { describe, expect, it } from 'vitest';
import { analyzeFiles } from '../src/analyzer.js';
import {
  assessReviewRisk,
  collectSecuritySignals,
  createSuggestedVerifications,
} from '../src/review-summary.js';

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

  it('adds security risk when security-sensitive files are detected', () => {
    const analysis = analyzeFiles(['src/auth/sessionManager.ts']);

    const risk = assessReviewRisk(analysis, undefined, {
      suspiciousPatterns: ['auth'],
    });

    expect(risk.reasons.some((reason) => reason.includes('Security-sensitive files changed'))).toBe(
      true,
    );
    expect(risk.score).toBeGreaterThanOrEqual(2);
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

  it('detects security-sensitive files with configured patterns', () => {
    const analysis = analyzeFiles([
      'src/auth/login.tsx',
      'src/utils/tokenManager.ts',
      'src/components/Button.tsx',
    ]);
    const signals = collectSecuritySignals(analysis, {
      suspiciousPatterns: ['auth', 'token'],
    });

    expect(signals.map((item) => item.file).sort()).toEqual(
      ['src/auth/login.tsx', 'src/utils/tokenManager.ts'].sort(),
    );
  });

  it('adds security-sensitive verification suggestion', () => {
    const analysis = analyzeFiles(['src/auth/login.tsx']);
    const suggestions = createSuggestedVerifications(analysis, undefined, {
      suspiciousPatterns: ['auth'],
      enabled: true,
    });

    expect(suggestions.map((item) => item.command)).toContain('npm run test');
  });
});
