import { countTotalFiles, type AnalysisResult } from './analyzer.js';

type RiskLevel = 'Low' | 'Medium' | 'High';

export type VerificationSuggestion = {
  command: string;
  reason: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  reasons: string[];
};

const SHARED_COMPONENT_PATTERN = /(^|\/)(shared|common)(\/|$)/;

const toRiskLevel = (score: number): RiskLevel => {
  if (score >= 4) {
    return 'High';
  }

  if (score >= 2) {
    return 'Medium';
  }

  return 'Low';
};

export const assessReviewRisk = (analysis: AnalysisResult): RiskAssessment => {
  const reasons: string[] = [];
  let score = 0;
  const total = countTotalFiles(analysis);

  if (analysis.configFiles.length > 0) {
    score += 2;
    reasons.push('Configuration files changed; build and runtime behavior can be impacted.');
  }

  if (analysis.apiFiles.length > 0) {
    score += 1;
    reasons.push('API files changed; request/response contract compatibility should be reviewed.');
  }

  if (analysis.apiFiles.length > 0 && analysis.tests.length === 0) {
    score += 2;
    reasons.push('API changes without any changed test file may increase regression risk.');
  }

  if (analysis.hooks.length > 0) {
    score += 1;
    reasons.push('Hook logic changed; lifecycle and dependency behavior should be re-validated.');
  }

  const changedSharedComponent = analysis.reactComponents.some((file) =>
    SHARED_COMPONENT_PATTERN.test(file.toLowerCase()),
  );
  if (changedSharedComponent) {
    score += 1;
    reasons.push('Shared React components changed; ripple effects to multiple screens are likely.');
  }

  if (analysis.styles.length > 0 && total > 0 && total === analysis.styles.length) {
    reasons.push('Only style files changed; functional behavior risk is typically low.');
  }

  if (reasons.length === 0) {
    reasons.push('No high-impact patterns detected from the current file mix.');
  }

  return {
    level: toRiskLevel(score),
    score,
    reasons,
  };
};

const uniqueSuggestion = (items: VerificationSuggestion[]): VerificationSuggestion[] => {
  const lookup = new Set<string>();

  return items.filter((item) => {
    const key = item.command;
    if (lookup.has(key)) {
      return false;
    }

    lookup.add(key);
    return true;
  });
};

export const createSuggestedVerifications = (
  analysis: AnalysisResult,
): VerificationSuggestion[] => {
  const suggestions: VerificationSuggestion[] = [];
  const total = countTotalFiles(analysis);

  if (total > 0 && analysis.tests.length === 0) {
    suggestions.push({
      command: 'npm run test',
      reason:
        'No test file changed while implementation changed; full test run helps catch regressions early.',
    });
  }

  if (analysis.configFiles.length > 0 || analysis.apiFiles.length > 0) {
    suggestions.push({
      command: 'npm run build',
      reason:
        'Build verifies configuration and API-adjacent changes do not break compilation or runtime entrypoints.',
    });
  }

  if (analysis.hooks.length > 0 || analysis.reactComponents.length > 0) {
    suggestions.push({
      command: 'npm run test',
      reason:
        'UI logic changes (Hooks/Components) should be validated with component and integration tests.',
    });
  }

  if (analysis.styles.length > 0) {
    suggestions.push({
      command: 'npm run test',
      reason: 'Style-only changes can still break visual regression tests or snapshots.',
    });
  }

  return uniqueSuggestion(suggestions);
};
