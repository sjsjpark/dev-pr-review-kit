import { describe, expect, it } from 'vitest';
import { analyzeFiles } from '../src/analyzer.js';

describe('analyzeFiles', () => {
  it('classifies changed files by category', () => {
    const result = analyzeFiles([
      'src/components/Button.tsx',
      'src/hooks/useUser.ts',
      'src/styles/global.css',
      'src/api/userApi.ts',
      'src/components/Button.test.tsx',
      'vite.config.ts',
      'README.md',
    ]);

    expect(result.reactComponents).toContain('src/components/Button.tsx');
    expect(result.hooks).toContain('src/hooks/useUser.ts');
    expect(result.styles).toContain('src/styles/global.css');
    expect(result.apiFiles).toContain('src/api/userApi.ts');
    expect(result.tests).toContain('src/components/Button.test.tsx');
    expect(result.configFiles).toContain('vite.config.ts');
    expect(result.otherFiles).toContain('README.md');
  });
});
