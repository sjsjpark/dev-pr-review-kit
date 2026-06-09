import { describe, expect, it } from 'vitest';
import { analyzeFiles } from '../src/analyzer.js';
import {
  createJsonReport,
  createMarkdownReport,
  type ReportContext,
} from '../src/report-writer.js';
import { assessReviewRisk, createSuggestedVerifications } from '../src/review-summary.js';

describe('report writers', () => {
  it('creates markdown report with risk summary and verification', () => {
    const analysis = analyzeFiles(['src/hooks/useUser.ts', 'src/api/userApi.ts']);
    const context: ReportContext = {
      files: ['src/hooks/useUser.ts', 'src/api/userApi.ts'],
      analysis,
      risk: assessReviewRisk(analysis),
      suggestedVerifications: createSuggestedVerifications(analysis),
      generatedAt: '2026-06-01T00:00:00.000Z',
    };
    const markdown = createMarkdownReport(context);

    expect(markdown).toContain('## Risk Summary');
    expect(markdown).toContain('Suggested Verification');
    expect(markdown).toContain('npm run test');
  });

  it('creates valid json report payload', () => {
    const analysis = analyzeFiles(['src/styles/global.css']);
    const context: ReportContext = {
      files: ['src/styles/global.css'],
      analysis,
      risk: assessReviewRisk(analysis),
      suggestedVerifications: createSuggestedVerifications(analysis),
      generatedAt: '2026-06-01T00:00:00.000Z',
    };

    const parsed = JSON.parse(createJsonReport(context));

    expect(parsed.totalChangedFiles).toBe(1);
    expect(Array.isArray(parsed.suggestedVerifications)).toBe(true);
    expect(parsed.risk.level).toBe('Low');
  });
});
