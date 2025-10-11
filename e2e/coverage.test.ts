import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { testCases } from './utils/test-cases';
import { validateVerbCoverage, collectTestedVerbs } from './utils/coverage-validator';
import { ALL_VERBS } from './utils/types';
import { COMMAND_NAMES } from '../src/parser/definitions/cbpl.generated';

// Zod schema for validating cbpl.definitions.json structure
const ParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name cannot be empty'),
  type: z.enum(['string', 'number'], {
    errorMap: () => ({ message: 'Parameter type must be "string" or "number"' }),
  }),
  description: z.string().min(1, 'Parameter description cannot be empty'),
  validation: z
    .object({
      min: z.number(),
      max: z.number(),
    })
    .optional(),
});

const CommandDefinitionSchema = z.object({
  name: z.string().min(1, 'Command name cannot be empty'),
  description: z.string().min(1, 'Command description cannot be empty'),
  parameters: z.array(ParameterSchema).min(1, 'Command must have at least one parameter'),
  examples: z.array(z.string()).min(1, 'Command must have at least one example'),
});

const CBPLDefinitionsSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
    commands: z.record(
      z.string().regex(/^[A-Z]+$/, 'Command keys must be uppercase letters only'),
      CommandDefinitionSchema
    ),
  })
  .strict();

describe('E2E Test Coverage Validator', () => {
  it('should validate cbpl.definitions.json format', () => {
    const definitionsPath = join(__dirname, '../cbpl.definitions.json');
    const rawDefinitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'));

    // Validate against schema
    const result = CBPLDefinitionsSchema.safeParse(rawDefinitions);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
        return `  • ${path}: ${issue.message}`;
      });

      throw new Error(
        `❌ Invalid cbpl.definitions.json format:\n\n${errors.join('\n')}\n\nPlease fix the errors above.`
      );
    }

    // Additional validation: command names must match their keys
    for (const [key, command] of Object.entries(result.data.commands)) {
      if (command.name !== key) {
        throw new Error(
          `❌ Command key "${key}" does not match command name "${command.name}"\n   Command names must match their object keys.`
        );
      }
    }

    expect(result.success).toBe(true);
  });

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
    const individualTests = testCases.filter((tc) => tc.verbs.length === 1);

    // At least SAY, CHUNKSIZE, CHUNKLATENCY, and TOOLCALL should be tested individually
    for (const verb of ALL_VERBS) {
      const hasIndividualTest = individualTests.some((tc) => tc.verbs.includes(verb));
      if (!hasIndividualTest) {
        console.warn(`⚠️  WARNING: ${verb} does not have an individual test case`);
      }
    }
  });

  it('should have at least one combo test', () => {
    const comboTests = testCases.filter((tc) => tc.verbs.length > 2);
    expect(comboTests.length).toBeGreaterThan(0);
    console.log('✓ Combo tests:', comboTests.map((tc) => tc.name).join(', '));
  });

  it('should verify codegen is up-to-date with cbpl.definitions.json', () => {
    // Read the source JSON definitions
    const definitionsPath = join(__dirname, '../cbpl.definitions.json');
    const definitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'));
    const jsonCommands = Object.keys(definitions.commands).sort();

    // Get generated command names
    const generatedCommands = [...COMMAND_NAMES].sort();

    // Compare arrays
    expect(generatedCommands).toEqual(jsonCommands);

    // If they don't match, provide helpful error message
    const addedCommands = jsonCommands.filter((cmd) => !generatedCommands.includes(cmd));
    const removedCommands = generatedCommands.filter((cmd) => !jsonCommands.includes(cmd));

    if (addedCommands.length > 0 || removedCommands.length > 0) {
      let errorMsg = '❌ Generated types are out of sync with cbpl.definitions.json\n';
      if (addedCommands.length > 0) {
        errorMsg += `\nCommands added to JSON but not generated: ${addedCommands.join(', ')}`;
      }
      if (removedCommands.length > 0) {
        errorMsg += `\nCommands in generated code but not in JSON: ${removedCommands.join(', ')}`;
      }
      errorMsg += '\n\nRun: pnpm codegen';
      throw new Error(errorMsg);
    }
  });
});
