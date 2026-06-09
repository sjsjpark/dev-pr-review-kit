#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeFiles } from './analyzer.js';
import { collectChangedFilesFromGit } from './git-diff.js';
import {
  createJsonReport,
  createMarkdownReport,
  type ReportContext,
} from './report-writer.js';
import { assessReviewRisk, createSuggestedVerifications } from './review-summary.js';
import { filterFiles, parsePatternList } from './file-filter.js';

type InputFile = {
  files: string[];
};

const getArgValue = (name: string): string | undefined => {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const inputPath = getArgValue('--input');
const base = getArgValue('--base');
const from = getArgValue('--from');
const format = getArgValue('--format')?.toLowerCase() || 'markdown';
const include = getArgValue('--include');
const exclude = getArgValue('--exclude');
const explicitOutputPath = getArgValue('--output');

if (!inputPath && !base && !from) {
  console.error(
    'Usage: dev-pr-review-kit (--input examples/changed-files.json | --base main | --from HEAD~1) [--format markdown|md|json] [--include ...] [--exclude ...] [--output report.md]',
  );
  process.exit(1);
}

if (inputPath && (base || from)) {
  console.error('Invalid options: use --input or git diff options, not both.');
  process.exit(1);
}

if (format !== 'markdown' && format !== 'md' && format !== 'json') {
  console.error('Invalid format: use --format markdown|md|json');
  process.exit(1);
}

const resolvedFormat = format === 'md' ? 'markdown' : format;

const files = inputPath
  ? (() => {
      const raw = readFileSync(resolve(inputPath), 'utf-8');
      const parsed = JSON.parse(raw) as InputFile;

      if (!Array.isArray(parsed.files)) {
        console.error('Invalid input: "files" must be an array.');
        process.exit(1);
      }

      return parsed.files;
    })()
  : collectChangedFilesFromGit({ base, from });

const filteredFiles = filterFiles(files, {
  includePatterns: parsePatternList(include),
  excludePatterns: parsePatternList(exclude),
});

const analysis = analyzeFiles(filteredFiles);
const risk = assessReviewRisk(analysis);
const suggestedVerifications = createSuggestedVerifications(analysis);
const reportContext: ReportContext = {
  analysis,
  files: filteredFiles,
  risk,
  suggestedVerifications,
  generatedAt: new Date().toISOString(),
};

const report =
  resolvedFormat === 'json'
    ? createJsonReport(reportContext)
    : createMarkdownReport(reportContext);

const resolvedOutputPath =
  explicitOutputPath ?? (resolvedFormat === 'json'
    ? 'pr-review-report.json'
    : 'pr-review-report.md');

writeFileSync(resolve(resolvedOutputPath), report, 'utf-8');

console.log(`PR review report generated: ${resolvedOutputPath}`);
