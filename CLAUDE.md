# TypeScript Type Predicate Generator Helpers

## Common Commands
- Build: `cd generator && npm run build`
- Check: `cd generator && npm run check` (typecheck + tests)
- Run tests: `cd generator && npm test` 
- Run single test: `cd generator && npx vitest [pattern]`
- E2E test: `cd tests/e2e && ./test.sh`
- Generate type guards: `npm run --silent build && node dist/index.js [file.ts]`

## Code Style
- Use TypeScript strict mode
- Naming: PascalCase for types, camelCase for variables/functions/methods
- Prefer explicit types over inferred types in signatures
- Use satisfies operator for type safety validation
- Follow factory pattern for AST node creation
- Use constants for reusable strings/values

## Code Structure
- Split model from code generation logic
- Create intermediate type representation
- Each type gets dedicated class with proper inheritance
- Group related functionality in well-named classes
- Optimize for speed and readability

## Error Handling
- Use specific error types defined in errors.ts
- Focus on early validation to prevent runtime errors
- Use assertion functions from helpers.ts