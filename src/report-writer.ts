import { countTotalFiles, type AnalysisResult } from './analyzer.js';
import { buildReviewPrompt } from './prompt-builder.js';
import type {
  type SecurityMatch,
  type RiskAssessment,
  type VerificationSuggestion,
} from './review-summary.js';

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

const formatSecurity = (signals: SecurityMatch[]): string => {
  const body =
    signals.length > 0
      ? signals
          .map((signal) => `${signal.file} (${signal.patterns.join(', ')})`)
          .join('\n')
      : '- None';
  return `## Security Signals\n${body}`;
};

const formatAiReview = (aiReview: string | undefined): string => {
  if (!aiReview) {
    return '';
  }

  return `## AI Review Suggestions\n${aiReview}\n`;
};

export type ReportContext = {
  analysis: AnalysisResult;
  files: string[];
  risk: RiskAssessment;
  securitySignals: SecurityMatch[];
  suggestedVerifications: VerificationSuggestion[];
  aiReview?: string;
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

${formatSecurity(context.securitySignals)}

${formatAiReview(context.aiReview)}

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
    securitySignals: context.securitySignals,
    risk: context.risk,
    aiReview: context.aiReview,
    suggestedVerifications: context.suggestedVerifications,
  };

  return `${JSON.stringify(payload, null, 2)}\n`;
};
