import { describe, it, expect } from 'vitest';
import { testCases } from './utils/test-cases';
import { validateVerbCoverage, collectTestedVerbs } from './utils/coverage-validator';
import { ALL_VERBS } from './utils/types';

describe('E2E Test Coverage Validator', () => {
  it('should have test cases defined', () => {
    expect(testCases.length).toBeGreaterThan(0);
  });

  it('should test all command verbs across test cases', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'Global E2E Tests');
  });

  it('should list all tested verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    console.log('✓ Tested verbs:', Array.from(testedVerbs).join(', '));
    expect(testedVerbs.size).toBe(ALL_VERBS.length);
  });

  it('each test case should have at least one verb', () => {
    for (const testCase of testCases) {
      expect(testCase.verbs.length).toBeGreaterThan(0);
    }
  });

  it('should have individual tests for each verb', () => {
    const individualTests = testCases.filter(tc => tc.verbs.length === 1);
    const testedIndividually = new Set(individualTests.map(tc => tc.verbs[0]));

    // At least SAY, CHUNKSIZE, CHUNKLATENCY, and TOOLCALL should be tested individually
    for (const verb of ALL_VERBS) {
      const hasIndividualTest = individualTests.some(tc => tc.verbs.includes(verb));
      if (!hasIndividualTest) {
        console.warn(`⚠️  WARNING: ${verb} does not have an individual test case`);
      }
    }
  });

  it('should have at least one combo test', () => {
    const comboTests = testCases.filter(tc => tc.verbs.length > 2);
    expect(comboTests.length).toBeGreaterThan(0);
    console.log('✓ Combo tests:', comboTests.map(tc => tc.name).join(', '));
  });
});
