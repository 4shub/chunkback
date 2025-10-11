# E2E Tests

End-to-end tests for all API endpoints (OpenAI, Anthropic, and Gemini).

## Structure

```
e2e/
├── anthropic/          # Anthropic endpoint tests
├── gemini/             # Gemini endpoint tests
├── openai/             # OpenAI endpoint tests
├── utils/              # Shared utilities
│   ├── types.ts        # Type definitions
│   ├── test-cases.ts   # Shared test cases
│   ├── server.ts       # Test server utilities
│   └── coverage-validator.ts  # Verb coverage validator
└── coverage.test.ts    # Global coverage validation
```

## Running Tests

```bash
# Run all e2e tests
npm run test:e2e

# Run in watch mode
npm test
```

## Test Coverage

Each provider endpoint tests the following verbs:
- **SAY** - Returns text content
- **CHUNKSIZE** - Controls chunk size for streaming
- **CHUNKLATENCY** - Controls delay between chunks
- **TOOLCALL** - Invokes tool calls

### Coverage Validation

The test suite includes a coverage validator that:
1. Ensures all verbs are tested for each provider
2. Warns if any verb is missing from test cases
3. Validates that combo tests exist
4. Fails the test suite if any verb is not covered

## Test Cases

All test cases are defined in `utils/test-cases.ts` and shared across all provider tests:

1. Individual verb tests (SAY, CHUNKSIZE, CHUNKLATENCY, TOOLCALL)
2. Combo test with multiple verbs
3. Each test validates response format and content

## Adding New Verbs

When adding a new command verb:

1. Add it to `ALL_VERBS` in `utils/types.ts`
2. Add test cases to `utils/test-cases.ts`
3. The coverage validator will automatically warn if it's not tested
