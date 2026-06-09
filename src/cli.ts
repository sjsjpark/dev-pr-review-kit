#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { analyzeFiles } from './analyzer.js';
import { collectChangedFilesFromGit } from './git-diff.js';
import { createMarkdownReport } from './report-writer.js';

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
const outputPath = getArgValue('--output') ?? 'pr-review-report.md';

if (!inputPath && !base && !from) {
  console.error(
    'Usage: dev-pr-review-kit (--input examples/changed-files.json | --base main | --from HEAD~1) [--output report.md]',
  );
  process.exit(1);
}

if (inputPath && (base || from)) {
  console.error('Invalid options: use --input or git diff options, not both.');
  process.exit(1);
}

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

const analysis = analyzeFiles(files);
const report = createMarkdownReport(analysis);

writeFileSync(resolve(outputPath), report, 'utf-8');

console.log(`PR review report generated: ${outputPath}`);
