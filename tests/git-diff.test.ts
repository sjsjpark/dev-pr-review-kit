import { describe, expect, it } from 'vitest';
import { collectChangedFilesFromGit } from '../src/git-diff.js';

describe('collectChangedFilesFromGit', () => {
  it('collects changed files against a base branch including untracked files', () => {
    const calls: string[][] = [];

    const files = collectChangedFilesFromGit({
      base: 'main',
      runGit: (args) => {
        calls.push(args);
        if (args[0] === 'ls-files') {
          return 'tests/git-diff.test.ts\n';
        }
        return 'src/components/Button.tsx\nsrc/api/userApi.ts\n\n';
      },
    });

    expect(calls).toEqual([
      ['diff', '--name-only', '--diff-filter=ACMRTUXB', 'main'],
      ['ls-files', '--others', '--exclude-standard'],
    ]);
    expect(files).toEqual([
      'src/components/Button.tsx',
      'src/api/userApi.ts',
      'tests/git-diff.test.ts',
    ]);
  });

  it('collects changed files from a direct git revision range', () => {
    const calls: string[][] = [];

    const files = collectChangedFilesFromGit({
      from: 'HEAD~1',
      runGit: (args) => {
        calls.push(args);
        if (args[0] === 'ls-files') {
          return '';
        }
        return 'src/hooks/useUser.ts\n';
      },
    });

    expect(calls).toEqual([
      ['diff', '--name-only', '--diff-filter=ACMRTUXB', 'HEAD~1'],
      ['ls-files', '--others', '--exclude-standard'],
    ]);
    expect(files).toEqual(['src/hooks/useUser.ts']);
  });

  it('deduplicates files that appear in multiple git outputs', () => {
    const files = collectChangedFilesFromGit({
      from: 'HEAD',
      runGit: (args) => {
        if (args[0] === 'ls-files') {
          return 'src/cli.ts\nsrc/git-diff.ts\n';
        }
        return 'src/cli.ts\nREADME.md\n';
      },
    });

    expect(files).toEqual(['src/cli.ts', 'README.md', 'src/git-diff.ts']);
  });

  it('rejects ambiguous base and from options', () => {
    expect(() =>
      collectChangedFilesFromGit({
        base: 'main',
        from: 'HEAD~1',
        runGit: () => '',
      }),
    ).toThrow('Use either --base or --from, not both.');
  });
});
