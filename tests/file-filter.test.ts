import { describe, expect, it } from 'vitest';
import { filterFiles, parsePatternList } from '../src/file-filter.js';

describe('file filter', () => {
  it('keeps only files that match include patterns', () => {
    const files = ['src/components/Button.tsx', 'src/hooks/useUser.ts', 'README.md'];

    const result = filterFiles(files, {
      includePatterns: parsePatternList('src/**/*.tsx,README.md'),
    });

    expect(result).toEqual(['src/components/Button.tsx', 'README.md']);
  });

  it('removes files that match exclude patterns', () => {
    const files = ['src/components/Button.tsx', 'src/hooks/useUser.ts', 'README.md'];

    const result = filterFiles(files, {
      excludePatterns: parsePatternList('**/*.tsx,README.md'),
    });

    expect(result).toEqual(['src/hooks/useUser.ts']);
  });

  it('supports simple comma-separated pattern input', () => {
    expect(parsePatternList(' src/*.ts ,dist/**,')).toEqual(['src/*.ts', 'dist/**']);
  });
});
