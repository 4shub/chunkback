## Description

<!-- Provide a brief description of your changes -->

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] CBPL command addition/modification

## Changes Made

<!-- List the specific changes you made -->

-
-
-

## Related Issues

<!-- Link any related issues here -->

Fixes #
Closes #

## Testing

### How Has This Been Tested?

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit tests
- [ ] E2E tests
- [ ] Manual testing

### Test Configuration

- Node.js version:
- pnpm version:

## Checklist

Before submitting this PR, please ensure:

### Code Quality

- [ ] All tests pass locally (`pnpm test:all`)
- [ ] Type checking passes (`pnpm typecheck`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Code is formatted (`pnpm format`)
- [ ] No console.log or debugger statements left in code

### CBPL Commands (if applicable)

- [ ] Ran `pnpm codegen` after editing `cbpl.definitions.json`
- [ ] Updated lexer token types
- [ ] Updated parser logic
- [ ] Added streaming execution logic
- [ ] Added unit tests for new command
- [ ] Added E2E tests for all providers (OpenAI, Anthropic, Gemini)
- [ ] Verified generated `CBPL.md` is correct

### Documentation

- [ ] Updated documentation if needed
- [ ] Added JSDoc comments for new public APIs
- [ ] Updated README if user-facing changes were made

### Git

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] My commits are clear and descriptive
- [ ] I have rebased on the latest main branch

## Screenshots (if applicable)

<!-- Add screenshots or GIFs demonstrating your changes -->

## Additional Notes

<!-- Any additional information that reviewers should know -->
