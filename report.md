# PR Review Report

## Summary

Total changed files: 8

| Area | Count |
| --- | ---: |
| React Components | 2 |
| Hooks | 1 |
| Styles | 1 |
| Tests | 1 |
| API Files | 1 |
| Config Files | 1 |
| Other Files | 1 |

## React Components
- src/components/Button.tsx
- src/components/UserCard.tsx

## Hooks
- src/hooks/useUser.ts

## Styles
- src/styles/global.css

## Tests
- src/components/Button.test.tsx

## API Files
- src/api/userApi.ts

## Config Files
- vite.config.ts

## Other Files
- README.md

## Review Checklist

- [ ] Are TypeScript types explicit and safe?
- [ ] Are React components simple and reusable?
- [ ] Are hooks free from stale closure or dependency issues?
- [ ] Are accessibility attributes considered?
- [ ] Are API errors and loading states handled?
- [ ] Are tests added or updated for changed behavior?
- [ ] Is there any unnecessary complexity?

## Codex Review Prompt

```txt
You are reviewing a frontend pull request.

Focus on:
- React and TypeScript correctness
- Component design
- Hook dependency issues
- Accessibility
- State management risks
- API integration risks
- Missing or weak tests
- Unnecessary complexity

Changed files:

React components:
- src/components/Button.tsx
- src/components/UserCard.tsx

Hooks:
- src/hooks/useUser.ts

Styles:
- src/styles/global.css

Tests:
- src/components/Button.test.tsx

API files:
- src/api/userApi.ts

Config files:
- vite.config.ts

Other files:
- README.md

Please provide:
1. High-risk issues
2. Suggested improvements
3. Missing tests
4. Refactoring opportunities
5. Final review summary
```
