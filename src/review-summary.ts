import { countTotalFiles, type AnalysisResult } from './analyzer.js';

type RiskLevel = 'Low' | 'Medium' | 'High';

export type SecurityMatch = {
  file: string;
  patterns: string[];
};

export type RiskWeights = {
  configFiles: number;
  apiFiles: number;
  apiWithoutTests: number;
  hooks: number;
  sharedComponents: number;
};

export type SecurityPolicy = {
  enabled: boolean;
  riskWeight: number;
  suspiciousPatterns: string[];
};

export type VerificationSuggestion = {
  command: string;
  reason: string;
};

export type VerificationCommands = {
  whenNoTests: string;
  whenConfigOrApi: string;
  whenUiChange: string;
  whenStylesChanged: string;
  whenSecuritySensitiveChange: string;
};

export type RiskAssessment = {
  level: RiskLevel;
  score: number;
  reasons: string[];
};

const DEFAULT_RISK_WEIGHTS: RiskWeights = {
  configFiles: 2,
  apiFiles: 1,
  apiWithoutTests: 2,
  hooks: 1,
  sharedComponents: 1,
};

export const DEFAULT_VERIFICATION_COMMANDS: VerificationCommands = {
  whenNoTests: 'npm run test',
  whenConfigOrApi: 'npm run build',
  whenUiChange: 'npm run test',
  whenStylesChanged: 'npm run test',
  whenSecuritySensitiveChange: 'npm run test',
};

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  enabled: true,
  riskWeight: 2,
  suspiciousPatterns: [
    'auth',
    'oauth',
    'token',
    'session',
    'credential',
    'api-key',
    'apikey',
    'secret',
    'password',
    'private-key',
    'security',
    'csrf',
  ],
};

const SHARED_COMPONENT_PATTERN = /(^|\/)(shared|common)(\/|$)/;

const RISK_LEVEL_THRESHOLD_LOW = 2;
const RISK_LEVEL_THRESHOLD_HIGH = 4;
const NO_IMPACT_MESSAGE = 'No high-impact patterns detected from the current file mix.';
const STYLE_ONLY_MESSAGE = 'Only style files changed; functional behavior risk is typically low.';
const SECURITY_RISK_MESSAGE_PREFIX = 'Security-sensitive files changed: ';
const SECURITY_VERIFICATION_REASON =
  'Security-sensitive paths changed; run security-focused checks for data handling, secrets, and auth flows.';

const NO_TEST_COMMAND_REASON =
  'No test file changed while implementation changed; full test run helps catch regressions early.';
const CONFIG_API_RISK_REASON =
  'Build verifies configuration and API-adjacent changes do not break compilation or runtime entrypoints.';
const UI_CHANGE_VERIFICATION_REASON =
  'UI logic changes (Hooks/Components) should be validated with component and integration tests.';
const STYLES_CHANGED_VERIFICATION_REASON =
  'Style-only changes can still break visual regression tests or snapshots.';

const toRiskLevel = (score: number): RiskLevel => {
  if (score >= RISK_LEVEL_THRESHOLD_HIGH) {
    return 'High';
  }

  if (score >= RISK_LEVEL_THRESHOLD_LOW) {
    return 'Medium';
  }

  return 'Low';
};

const createRiskConfig = (riskWeights?: Partial<RiskWeights>): RiskWeights => ({
  ...DEFAULT_RISK_WEIGHTS,
  ...riskWeights,
});

const normalizeSecurityPatterns = (patterns: string[] | undefined): string[] =>
  [...new Set((patterns ?? [])
    .map((pattern) => pattern.trim().toLowerCase())
    .filter((pattern) => pattern.length > 0))];

const createSecurityConfig = (policy?: Partial<SecurityPolicy>): SecurityPolicy => ({
  ...DEFAULT_SECURITY_POLICY,
  ...policy,
  suspiciousPatterns: normalizeSecurityPatterns(policy?.suspiciousPatterns),
});

const getAllAnalyzedFiles = (analysis: AnalysisResult): string[] => [
  ...analysis.configFiles,
  ...analysis.apiFiles,
  ...analysis.reactComponents,
  ...analysis.hooks,
  ...analysis.styles,
  ...analysis.tests,
  ...analysis.otherFiles,
];

const collectSecuritySignals = (
  analysis: AnalysisResult,
  policy?: Partial<SecurityPolicy>,
): SecurityMatch[] => {
  const normalizedPolicy = createSecurityConfig(policy);
  if (!normalizedPolicy.enabled) {
    return [];
  }

  return getAllAnalyzedFiles(analysis)
    .map((file) => {
      const normalizedFile = file.toLowerCase();
      const matchedPatterns = normalizedPolicy.suspiciousPatterns.filter((pattern) =>
        normalizedFile.includes(pattern),
      );
      if (matchedPatterns.length === 0) {
        return null;
      }

      return {
        file,
        patterns: matchedPatterns,
      };
    })
    .filter((item): item is SecurityMatch => item !== null);
};

export const assessReviewRisk = (
  analysis: AnalysisResult,
  riskWeights?: Partial<RiskWeights>,
  securityPolicy?: Partial<SecurityPolicy>,
  securitySignals?: SecurityMatch[],
): RiskAssessment => {
  const reasons: string[] = [];
  const normalizedWeights = createRiskConfig(riskWeights);
  const normalizedSecurityPolicy = createSecurityConfig(securityPolicy);
  const resolvedSecuritySignals = securitySignals ?? collectSecuritySignals(analysis, normalizedSecurityPolicy);
  let score = 0;
  const total = countTotalFiles(analysis);

  if (analysis.configFiles.length > 0) {
    score += normalizedWeights.configFiles;
    reasons.push('Configuration files changed; build and runtime behavior can be impacted.');
  }

  if (analysis.apiFiles.length > 0) {
    score += normalizedWeights.apiFiles;
    reasons.push('API files changed; request/response contract compatibility should be reviewed.');
  }

  if (analysis.apiFiles.length > 0 && analysis.tests.length === 0) {
    score += normalizedWeights.apiWithoutTests;
    reasons.push('API changes without any changed test file may increase regression risk.');
  }

  if (analysis.hooks.length > 0) {
    score += normalizedWeights.hooks;
    reasons.push('Hook logic changed; lifecycle and dependency behavior should be re-validated.');
  }

  const changedSharedComponent = analysis.reactComponents.some((file) =>
    SHARED_COMPONENT_PATTERN.test(file.toLowerCase()),
  );
  if (changedSharedComponent) {
    score += normalizedWeights.sharedComponents;
    reasons.push('Shared React components changed; ripple effects to multiple screens are likely.');
  }

  if (analysis.styles.length > 0 && total > 0 && total === analysis.styles.length) {
    reasons.push(STYLE_ONLY_MESSAGE);
  }

  if (resolvedSecuritySignals.length > 0) {
    const securityWeight = normalizedSecurityPolicy.riskWeight;
    if (securityPolicy?.enabled !== false) {
      score += securityWeight;
    }
    reasons.push(
      `${SECURITY_RISK_MESSAGE_PREFIX}${resolvedSecuritySignals
        .map((signal) => `${signal.file} (${signal.patterns.join(', ')})`)
        .join(', ')}`,
    );
  }

  if (reasons.length === 0) {
    reasons.push(NO_IMPACT_MESSAGE);
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
  commands: VerificationCommands = DEFAULT_VERIFICATION_COMMANDS,
  securityPolicy?: Partial<SecurityPolicy>,
  securitySignals?: SecurityMatch[],
): VerificationSuggestion[] => {
  const suggestions: VerificationSuggestion[] = [];
  const resolvedSecuritySignals = securitySignals ?? collectSecuritySignals(analysis, securityPolicy);
  const total = countTotalFiles(analysis);

  if (total > 0 && analysis.tests.length === 0) {
    suggestions.push({
      command: commands.whenNoTests,
      reason: NO_TEST_COMMAND_REASON,
    });
  }

  if (analysis.configFiles.length > 0 || analysis.apiFiles.length > 0) {
    suggestions.push({
      command: commands.whenConfigOrApi,
      reason: CONFIG_API_RISK_REASON,
    });
  }

  if (analysis.hooks.length > 0 || analysis.reactComponents.length > 0) {
    suggestions.push({
      command: commands.whenUiChange,
      reason: UI_CHANGE_VERIFICATION_REASON,
    });
  }

  if (analysis.styles.length > 0) {
    suggestions.push({
      command: commands.whenStylesChanged,
      reason: STYLES_CHANGED_VERIFICATION_REASON,
    });
  }

  if (resolvedSecuritySignals.length > 0 && securityPolicy?.enabled !== false) {
    suggestions.push({
      command: commands.whenSecuritySensitiveChange,
      reason: SECURITY_VERIFICATION_REASON,
    });
  }

  return uniqueSuggestion(suggestions);
};

export { collectSecuritySignals };
