type FilePattern = string;

const FILE_SEPARATOR = /\\/g;

const DEFAULT_MAX_PATTERNS = 64;

const normalizePath = (value: string): string => value.replace(FILE_SEPARATOR, '/');

const normalizePatterns = (patterns: FilePattern[] | undefined): FilePattern[] =>
  [...new Set(patterns?.filter((pattern) => pattern.length > 0) ?? [])];

const escapePattern = (value: string): string =>
  value.replace(/[.+^${}()|[\]\\]/g, '\\$&');

const buildPatternMatcher = (pattern: string): (file: string) => boolean => {
  const normalized = normalizePath(pattern.toLowerCase());

  if (!normalized.includes('*') && !normalized.includes('?')) {
    return (file) => normalizePath(file.toLowerCase()).includes(normalized);
  }

  const patternRegex = escapePattern(normalized)
    .split('')
    .map((character) => {
      if (character === '*') {
        return '.*';
      }

      if (character === '?') {
        return '.';
      }

      return character;
    })
    .join('');

  const regex = new RegExp(`^${patternRegex}$`);
  return (file) => regex.test(normalizePath(file.toLowerCase()));
};

const toPatternMatchers = (patterns: string[]): Array<(file: string) => boolean> =>
  patterns.map((pattern) => buildPatternMatcher(pattern));

export const parsePatternList = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return normalizePatterns(
    value
      .split(',')
      .map((pattern) => pattern.trim())
      .filter((pattern) => pattern.length > 0),
  ).slice(0, DEFAULT_MAX_PATTERNS);
};

export const filterFiles = (
  files: string[],
  options?: { includePatterns?: string[]; excludePatterns?: string[] },
): string[] => {
  const includePatterns = normalizePatterns(options?.includePatterns);
  const excludePatterns = normalizePatterns(options?.excludePatterns);

  const includeMatchers = toPatternMatchers(includePatterns);
  const excludeMatchers = toPatternMatchers(excludePatterns);

  const include = (file: string): boolean =>
    includeMatchers.length === 0
      ? true
      : includeMatchers.some((matchPattern) => matchPattern(file));

  const filtered = files.filter(
    (file) => include(file) && !excludeMatchers.some((matchPattern) => matchPattern(file)),
  );

  return [...new Set(filtered)];
};
