export type FileCategory =
  | 'reactComponents'
  | 'hooks'
  | 'styles'
  | 'tests'
  | 'apiFiles'
  | 'configFiles'
  | 'otherFiles';

export type AnalysisResult = Record<FileCategory, string[]>;

const createEmptyResult = (): AnalysisResult => ({
  reactComponents: [],
  hooks: [],
  styles: [],
  tests: [],
  apiFiles: [],
  configFiles: [],
  otherFiles: [],
});

export const analyzeFiles = (files: string[]): AnalysisResult => {
  const result = createEmptyResult();

  for (const file of files) {
    const normalized = file.toLowerCase();

    if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(normalized)) {
      result.tests.push(file);
    } else if (/\.(css|scss|sass|less)$/.test(normalized)) {
      result.styles.push(file);
    } else if (/\/hooks?\//.test(normalized) || /use[A-Z]/.test(file)) {
      result.hooks.push(file);
    } else if (/\.(tsx|jsx)$/.test(normalized)) {
      result.reactComponents.push(file);
    } else if (/\/api\/|api\.|service\.|client\./.test(normalized)) {
      result.apiFiles.push(file);
    } else if (
      /package\.json|tsconfig|vite\.config|eslint|prettier|config/.test(normalized)
    ) {
      result.configFiles.push(file);
    } else {
      result.otherFiles.push(file);
    }
  }

  return result;
};

export const countTotalFiles = (result: AnalysisResult): number =>
  Object.values(result).reduce((sum, files) => sum + files.length, 0);
