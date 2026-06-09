# dev-pr-review-kit

A TypeScript CLI tool for generating structured PR review checklists and Codex-ready prompts for React and TypeScript projects.

## Why

Frontend pull requests often require repeated checks for component structure, TypeScript safety, React Hook dependencies, accessibility, API handling, test coverage, and unnecessary complexity.

`dev-pr-review-kit` helps developers prepare consistent PR review reports and AI-ready review prompts from local git changes or a list of changed files.

The project was created to reduce repetitive review preparation work and improve review quality in frontend development workflows.

## Features

- Classifies changed files by area:
  - React components
  - Hooks
  - Styles
  - Tests
  - API files
  - Config files
  - Other files

- Generates a Markdown PR review report
- Creates a Codex-ready review prompt
- Collects changed files from local git diff
- Suggests PR review risk level with reasons
- Suggests verification commands
- Detects security-sensitive file patterns and includes security signals in reports
- Generates optional AI review suggestions (OpenAI)
- Supports a simple JSON input format
- Supports markdown/json output
- Supports include/exclude pattern filtering for file sets
- Built with TypeScript
- Includes basic tests

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev -- --base main
```

You can compare against a direct git revision:

```bash
npm run dev -- --from HEAD~1
```

Use a config file to control include/exclude, risk, verification, and security policy:

```bash
npm run dev -- --base main --config examples/.pr-review-kit.json
```

You can also specify a custom output file:

```bash
npm run dev -- --base main --output report.md
```

JSON output is also available:

```bash
npm run dev -- --base main --format json --output report.json
```

Enable AI review generation by adding OpenAI configuration and passing `--openai-review`:

```bash
npm run dev -- --base main --openai-review --format markdown --output pr-review-report.md
```

or set `openaiReview.enabled` to `true` in your config file:

```bash
npm run dev -- --base main
```

You can filter input files by pattern:

```bash
npm run dev -- --base main --include "src/**" --exclude "**/*.test.ts,dist/**"
```

JSON input is still supported when you already have a changed-file list:

```bash
npm run dev -- --input examples/changed-files.json
```

## Example Input

```json
{
  "files": [
    "src/components/Button.tsx",
    "src/hooks/useUser.ts",
    "src/api/userApi.ts",
    "src/styles/global.css",
    "src/components/Button.test.tsx",
    "vite.config.ts"
  ]
}
```

## Example Output

The CLI generates a Markdown report with:

- Changed file summary
- File category breakdown
- Risk summary
- Review checklist
- Codex-ready review prompt
- Suggested verification commands
- AI review suggestions section (when enabled)

JSON output includes:

- generatedAt
- totalChangedFiles
- files
- analysis
- risk
- securitySignals
- suggestedVerifications
- aiReview

Example:

```md
# PR Review Report

## Summary

Total changed files: 6

## Review Checklist

- [ ] Are TypeScript types explicit and safe?
- [ ] Are React components simple and reusable?
- [ ] Are hooks free from stale closure or dependency issues?
- [ ] Are accessibility attributes considered?
- [ ] Are API errors and loading states handled?
- [ ] Are tests added or updated for changed behavior?
- [ ] Is there any unnecessary complexity?
```

## Scripts

```bash
npm run dev
npm run build
npm run test
```

## Project Structure

```txt
src/
  file-filter.ts
  analyzer.ts
  cli.ts
  git-diff.ts
  index.ts
  review-summary.ts
  prompt-builder.ts
  report-writer.ts

examples/
  changed-files.json
  .pr-review-kit.json

templates/
  review-prompt.md

tests/
  analyzer.test.ts
  file-filter.test.ts
  config.test.ts
  report-writer.test.ts
  git-diff.test.ts
  review-summary.test.ts
```

## Roadmap

- Add GitHub Actions example
- Add advanced security policy profiles (team presets, compliance modes)
- Add support for monorepo frontend projects

## OpenAI Review Configuration

`.pr-review-kit.json` example:

```json
{
  "openaiReview": {
    "enabled": false,
    "apiKeyEnv": "OPENAI_API_KEY",
    "model": "gpt-4o-mini",
    "temperature": 0.2,
    "maxTokens": 600,
    "requestTimeoutMs": 30000
  }
}
```

`apiKeyEnv` points to the environment variable name containing the OpenAI API key.  
The CLI also accepts `--openai-review` to run AI review for that command only.

## Contributing

Contributions are welcome.

You can contribute by:

- Reporting bugs
- Improving documentation
- Adding new review rules
- Improving file classification
- Suggesting workflow integrations

## License

MIT
