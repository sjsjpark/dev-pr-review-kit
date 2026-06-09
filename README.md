# dev-pr-review-kit

A TypeScript CLI tool for generating structured PR review checklists and Codex-ready prompts for React and TypeScript projects.

## Why

Frontend pull requests often require repeated checks for component structure, TypeScript safety, React Hook dependencies, accessibility, API handling, test coverage, and unnecessary complexity.

`dev-pr-review-kit` helps developers prepare consistent PR review reports and AI-ready review prompts from a list of changed files.

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
- Supports a simple JSON input format
- Built with TypeScript
- Includes basic tests

## Installation

```bash
npm install
```

## Usage

```bash
npm run dev -- --input examples/changed-files.json
```

You can also specify a custom output file:

```bash
npm run dev -- --input examples/changed-files.json --output report.md
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
- Review checklist
- Codex-ready review prompt

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
  analyzer.ts
  cli.ts
  index.ts
  prompt-builder.ts
  report-writer.ts

examples/
  changed-files.json

templates/
  review-prompt.md

tests/
  analyzer.test.ts
```

## Roadmap

- Add Git diff support
- Add GitHub Actions example
- Add configurable review rules
- Add OpenAI API integration
- Add JSON output format
- Add support for monorepo frontend projects

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
