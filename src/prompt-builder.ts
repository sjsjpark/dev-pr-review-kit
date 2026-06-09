import type { ReportContext } from './report-writer.js';

const formatList = (files: string[]): string => {
  if (files.length === 0) return '- None';
  return files.map((file) => `- ${file}`).join('\n');
};

export const buildReviewPrompt = (context: ReportContext): string => {
  const { analysis, risk, suggestedVerifications } = context;

  const verification = suggestedVerifications
    .map((suggestion) => `- ${suggestion.command} - ${suggestion.reason}`)
    .join('\n');

  const riskSummary = [
    `Overall risk: ${risk.level} (score ${risk.score})`,
    ...risk.reasons,
  ].join('\n');

  return `You are reviewing a frontend pull request.

Focus on:
- React and TypeScript correctness
- Component design
- Hook dependency issues
- Accessibility
- State management risks
- API integration risks
- Missing or weak tests
- Unnecessary complexity

Changed files:

React components:
${formatList(analysis.reactComponents)}

Hooks:
${formatList(analysis.hooks)}

Styles:
${formatList(analysis.styles)}

Tests:
${formatList(analysis.tests)}

API files:
${formatList(analysis.apiFiles)}

Config files:
${formatList(analysis.configFiles)}

Other files:
${formatList(analysis.otherFiles)}

Risk:
${riskSummary}

Suggested verification:
${verification}

Please provide:
1. High-risk issues
2. Suggested improvements
3. Missing tests
4. Refactoring opportunities
5. Final review summary`;
};
