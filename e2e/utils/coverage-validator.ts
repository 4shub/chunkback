import { ALL_VERBS, CommandVerb } from './types';

export function validateVerbCoverage(testedVerbs: Set<CommandVerb>, testSuiteName: string): void {
  const missingVerbs = ALL_VERBS.filter(verb => !testedVerbs.has(verb));

  if (missingVerbs.length > 0) {
    console.warn(`⚠️  WARNING: ${testSuiteName} is missing tests for: ${missingVerbs.join(', ')}`);
    throw new Error(`${testSuiteName} must test all verbs. Missing: ${missingVerbs.join(', ')}`);
  }
}

export function collectTestedVerbs(testCases: Array<{ verbs: CommandVerb[] }>): Set<CommandVerb> {
  const testedVerbs = new Set<CommandVerb>();

  for (const testCase of testCases) {
    for (const verb of testCase.verbs) {
      testedVerbs.add(verb);
    }
  }

  return testedVerbs;
}
