import { readFileSync } from 'fs';
import { join } from 'path';
import { CBPLDefinitionsSchema, type CBPLDefinitions } from './schemas.js';

/**
 * Load and validate CBPL definitions from JSON file
 */
export function loadAndValidateDefinitions(): CBPLDefinitions {
  const definitionsPath = join(__dirname, '../../cbpl.definitions.json');
  let rawDefinitions: unknown;

  try {
    rawDefinitions = JSON.parse(readFileSync(definitionsPath, 'utf-8'));
  } catch (error) {
    console.error('❌ Failed to parse cbpl.definitions.json');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  // Validate against schema
  const validationResult = CBPLDefinitionsSchema.safeParse(rawDefinitions);

  if (!validationResult.success) {
    console.error('❌ Invalid cbpl.definitions.json schema:');
    console.error('');

    for (const issue of validationResult.error.issues) {
      const path = issue.path.length > 0 ? issue.path.join('.') : 'root';
      console.error(`  • ${path}: ${issue.message}`);
    }

    console.error('');
    console.error('Please fix the errors above and try again.');
    process.exit(1);
  }

  const definitions: CBPLDefinitions = validationResult.data;

  // Additional validation: ensure command names match their keys
  for (const [key, command] of Object.entries(definitions.commands)) {
    if (command.name !== key) {
      console.error(`❌ Command key "${key}" does not match command name "${command.name}"`);
      console.error('   Command names must match their object keys.');
      process.exit(1);
    }
  }

  return definitions;
}
