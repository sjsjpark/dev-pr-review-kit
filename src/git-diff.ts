import { execFileSync } from 'node:child_process';

type RunGit = (args: string[]) => string;

type CollectChangedFilesOptions = {
  base?: string;
  from?: string;
  runGit?: RunGit;
};

const defaultRunGit: RunGit = (args) =>
  execFileSync('git', args, { encoding: 'utf-8' });

const parseGitFileList = (output: string): string[] =>
  output
    .split('\n')
    .map((file) => file.trim())
    .filter((file) => file.length > 0);

const uniqueFiles = (files: string[]): string[] => [...new Set(files)];

export const collectChangedFilesFromGit = ({
  base,
  from,
  runGit = defaultRunGit,
}: CollectChangedFilesOptions): string[] => {
  if (base && from) {
    throw new Error('Use either --base or --from, not both.');
  }

  const revision = base ?? from;

  if (!revision) {
    throw new Error('A git revision is required.');
  }

  const trackedFiles = parseGitFileList(runGit([
    'diff',
    '--name-only',
    '--diff-filter=ACMRTUXB',
    revision,
  ]));

  const untrackedFiles = parseGitFileList(
    runGit(['ls-files', '--others', '--exclude-standard']),
  );

  return uniqueFiles([...trackedFiles, ...untrackedFiles]);
};
