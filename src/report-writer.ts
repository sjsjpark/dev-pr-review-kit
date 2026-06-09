import { countTotalFiles, type AnalysisResult } from './analyzer.js';
import { buildReviewPrompt } from './prompt-builder.js';

const section = (title: string, files: string[]): string => {
  const body = files.length > 0 ? files.map((file) => `- ${file}`).join('\n') : '- None';
  return `## ${title}\n${body}`;
};

export const createMarkdownReport = (analysis: AnalysisResult): string => {
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

${section('React Components', analysis.reactComponents)}

${section('Hooks', analysis.hooks)}

${section('Styles', analysis.styles)}

${section('Tests', analysis.tests)}

${section('API Files', analysis.apiFiles)}

${section('Config Files', analysis.configFiles)}

${section('Other Files', analysis.otherFiles)}

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
${buildReviewPrompt(analysis)}
\`\`\`
`;
};
