import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  type VerificationCommands,
  type RiskWeights,
  DEFAULT_VERIFICATION_COMMANDS,
  type SecurityPolicy,
  DEFAULT_SECURITY_POLICY,
} from './review-summary.js';

const DEFAULT_CONFIG_FILE = '.pr-review-kit.json';

export type ReviewPolicyConfig = {
  riskWeights: RiskWeights;
  verificationCommands: VerificationCommands;
};

export type SecurityPolicyConfig = SecurityPolicy;

export type ReviewKitConfig = {
  includePatterns: string[];
  excludePatterns: string[];
  reviewPolicy: ReviewPolicyConfig;
  securityPolicy: SecurityPolicyConfig;
};

type PartialReviewPolicyConfig = Partial<{
  riskWeights: Partial<RiskWeights>;
  verificationCommands: Partial<VerificationCommands>;
}>;

type ReviewKitConfigFile = Partial<{
  includePatterns: string[];
  excludePatterns: string[];
  reviewPolicy: PartialReviewPolicyConfig;
  securityPolicy: Partial<SecurityPolicyConfig>;
}>;

const DEFAULT_CONFIG: ReviewKitConfig = {
  includePatterns: [],
  excludePatterns: [],
  reviewPolicy: {
    riskWeights: {
      configFiles: 2,
      apiFiles: 1,
      apiWithoutTests: 2,
      hooks: 1,
      sharedComponents: 1,
    },
    verificationCommands: DEFAULT_VERIFICATION_COMMANDS,
  },
  securityPolicy: DEFAULT_SECURITY_POLICY,
};

const normalizePatterns = (patterns: string[] | undefined): string[] =>
  Array.isArray(patterns) ? [...new Set(patterns.filter((pattern) => pattern.trim().length > 0))] : [];

const createReviewPolicyConfig = (
  reviewPolicy?: PartialReviewPolicyConfig,
): ReviewPolicyConfig => ({
  riskWeights: {
    ...DEFAULT_CONFIG.reviewPolicy.riskWeights,
    ...(reviewPolicy?.riskWeights ?? {}),
  },
  verificationCommands: {
    ...DEFAULT_CONFIG.reviewPolicy.verificationCommands,
    ...(reviewPolicy?.verificationCommands ?? {}),
  },
});

const createSecurityPolicyConfig = (
  securityPolicy?: Partial<SecurityPolicyConfig>,
): SecurityPolicyConfig => ({
  ...DEFAULT_SECURITY_POLICY,
  ...securityPolicy,
  suspiciousPatterns: normalizePatterns(
    securityPolicy?.suspiciousPatterns?.map((pattern) => pattern.toLowerCase()),
  ),
});

const cloneConfig = (config: ReviewKitConfig): ReviewKitConfig => ({
  includePatterns: [...config.includePatterns],
  excludePatterns: [...config.excludePatterns],
  reviewPolicy: {
    riskWeights: { ...config.reviewPolicy.riskWeights },
    verificationCommands: { ...config.reviewPolicy.verificationCommands },
  },
  securityPolicy: {
    ...config.securityPolicy,
    suspiciousPatterns: [...config.securityPolicy.suspiciousPatterns],
  },
});

const buildConfig = (raw: ReviewKitConfigFile): ReviewKitConfig => ({
  includePatterns: normalizePatterns(raw.includePatterns),
  excludePatterns: normalizePatterns(raw.excludePatterns),
  reviewPolicy: createReviewPolicyConfig(raw.reviewPolicy),
  securityPolicy: createSecurityPolicyConfig(raw.securityPolicy),
});

export const loadConfig = (path?: string): ReviewKitConfig => {
  const configPath = resolve(path ?? DEFAULT_CONFIG_FILE);
  const useCustomPath = Boolean(path);

  if (!existsSync(configPath)) {
    if (useCustomPath) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    return cloneConfig(DEFAULT_CONFIG);
  }

  const raw = readFileSync(configPath, 'utf-8');
  let parsed: ReviewKitConfigFile;
  try {
    parsed = JSON.parse(raw) as ReviewKitConfigFile;
  } catch {
    throw new Error(`Invalid JSON in config file: ${configPath}`);
  }

  return cloneConfig(buildConfig(parsed));
};

export { DEFAULT_CONFIG as DEFAULT_REVIEW_KIT_CONFIG };
