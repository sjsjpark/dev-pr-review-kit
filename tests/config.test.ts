import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import { DEFAULT_REVIEW_KIT_CONFIG, loadConfig } from '../src/config.js';
import type { RiskWeights } from '../src/review-summary.js';

describe('loadConfig', () => {
  it('returns defaults when config file is missing', () => {
    const tempDir = mkdtempSync(`${tmpdir()}/dev-pr-review-kit-config-`);
    const targetPath = resolve(tempDir, 'missing-config.json');

    const config = loadConfig(targetPath);

    expect(config).toEqual(DEFAULT_REVIEW_KIT_CONFIG);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('loads config and merges with defaults', () => {
    const tempDir = mkdtempSync(`${tmpdir()}/dev-pr-review-kit-config-`);
    const targetPath = resolve(tempDir, '.pr-review-kit.json');
    const riskWeights: RiskWeights = {
      configFiles: 3,
      apiFiles: 2,
      apiWithoutTests: 4,
      hooks: 5,
      sharedComponents: 6,
    };

    writeFileSync(
      targetPath,
      JSON.stringify({
        includePatterns: ['src/**'],
        excludePatterns: ['**/*.test.ts'],
        reviewPolicy: {
          riskWeights,
        },
      }),
      'utf-8',
    );

    const config = loadConfig(targetPath);

    expect(config.includePatterns).toEqual(['src/**']);
    expect(config.excludePatterns).toEqual(['**/*.test.ts']);
    expect(config.reviewPolicy.riskWeights).toEqual({
      ...DEFAULT_REVIEW_KIT_CONFIG.reviewPolicy.riskWeights,
      ...riskWeights,
    });
    expect(config.reviewPolicy.verificationCommands).toEqual(
      DEFAULT_REVIEW_KIT_CONFIG.reviewPolicy.verificationCommands,
    );
    expect(config.securityPolicy).toEqual(
      DEFAULT_REVIEW_KIT_CONFIG.securityPolicy,
    );

    rmSync(tempDir, { recursive: true, force: true });
  });

  it('merges security policy from config file', () => {
    const tempDir = mkdtempSync(`${tmpdir()}/dev-pr-review-kit-config-`);
    const targetPath = resolve(tempDir, '.pr-review-kit.json');
    const suspiciousPatterns = ['auth', 'jwt'];

    writeFileSync(
      targetPath,
      JSON.stringify({
        securityPolicy: {
          enabled: false,
          suspiciousPatterns,
        },
      }),
      'utf-8',
    );

    const config = loadConfig(targetPath);

    expect(config.securityPolicy.enabled).toBe(false);
    expect(config.securityPolicy.riskWeight).toBe(DEFAULT_REVIEW_KIT_CONFIG.securityPolicy.riskWeight);
    expect(config.securityPolicy.suspiciousPatterns).toEqual(suspiciousPatterns);

    rmSync(tempDir, { recursive: true, force: true });
  });
});
