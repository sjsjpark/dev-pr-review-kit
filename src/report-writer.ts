import { countTotalFiles, type AnalysisResult } from './analyzer.js';
import { buildReviewPrompt } from './prompt-builder.js';
import type { RiskAssessment, VerificationSuggestion } from './review-summary.js';

const section = (title: string, files: string[]): string => {
  const body = files.length > 0 ? files.map((file) => `- ${file}`).join('\n') : '- None';
  return `## ${title}\n${body}`;
};

const reasonSection = (title: string, items: string[]): string => {
  const body = items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- None';
  return `## ${title}\n${body}`;
};

const formatVerification = (items: VerificationSuggestion[]): string => {
  const body =
    items.length > 0 ? items.map((item) => `- \`${item.command}\` - ${item.reason}`).join('\n') : '- None';
  return `## Suggested Verification\n${body}`;
};

export type ReportContext = {
  analysis: AnalysisResult;
  files: string[];
  risk: RiskAssessment;
  suggestedVerifications: VerificationSuggestion[];
  generatedAt: string;
};

export const createMarkdownReport = (context: ReportContext): string => {
  const { analysis, risk, suggestedVerifications } = context;
  const total = countTotalFiles(analysis);

  return `# PR Review Report

## Summary

Total changed files: ${total}

| Area | Count |
| --- | ---: |
| React Components | ${analysis.reactComponents.length} |
| Hooks | ${analysis.hooks.length} |
| Styles | ${analysis.styles.length} |
| Tests | ${analysis.tests.length} |
| API Files | ${analysis.apiFiles.length} |
| Config Files | ${analysis.configFiles.length} |
| Other Files | ${analysis.otherFiles.length} |

${reasonSection('Risk Summary', [
  `Overall risk: ${risk.level} (score ${risk.score})`,
  ...risk.reasons,
])}

${section('React Components', analysis.reactComponents)}

${section('Hooks', analysis.hooks)}

${section('Styles', analysis.styles)}

${section('Tests', analysis.tests)}

${section('API Files', analysis.apiFiles)}

${section('Config Files', analysis.configFiles)}

${section('Other Files', analysis.otherFiles)}

${formatVerification(suggestedVerifications)}

## Review Checklist

- [ ] Are TypeScript types explicit and safe?
- [ ] Are React components simple and reusable?
- [ ] Are hooks free from stale closure or dependency issues?
- [ ] Are accessibility attributes considered?
- [ ] Are API errors and loading states handled?
- [ ] Are tests added or updated for changed behavior?
- [ ] Is there any unnecessary complexity?

## Codex Review Prompt

\`\`\`txt
${buildReviewPrompt(context)}
\`\`\`
`;
};

export const createJsonReport = (context: ReportContext): string => {
  const total = countTotalFiles(context.analysis);
  const payload = {
    generatedAt: context.generatedAt,
    totalChangedFiles: total,
    files: context.files,
    analysis: context.analysis,
    risk: context.risk,
    suggestedVerifications: context.suggestedVerifications,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
};
