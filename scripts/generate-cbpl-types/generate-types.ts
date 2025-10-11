import type { CBPLDefinitions } from './schemas.js';

/**
 * Generate TypeScript types and runtime code from CBPL definitions
 */
export function generateTypes(definitions: CBPLDefinitions): string {
  const commandNames = Object.keys(definitions.commands);

  // Generate imports
  let code = `/**
 * CBPL Generated Types
 *
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: cbpl.definitions.json
 * Run 'pnpm codegen' to regenerate
 */

import { z } from 'zod';
import definitions from '../../../cbpl.definitions.json';

`;

  // Generate command name type
  code += `/**
 * Command names
 */
export type CBPLCommandName = ${commandNames.map((n) => `'${n}'`).join(' | ')};

`;

  // Generate command name array
  code += `/**
 * All command names
 */
export const COMMAND_NAMES: CBPLCommandName[] = [
  ${commandNames.map((n) => `'${n}'`).join(',\n  ')}
];

`;

  // Generate individual command interfaces
  for (const [cmdName, cmd] of Object.entries(definitions.commands)) {
    code += `/**
 * ${cmd.description}
 */
export interface ${cmdName}Command {
  type: '${cmdName}';
`;

    for (const param of cmd.parameters) {
      const tsType = param.type === 'string' ? 'string' : 'number';
      code += `  ${param.name}: ${tsType};\n`;
    }

    code += `}\n\n`;
  }

  // Generate union type
  code += `/**
 * All command types
 */
export type Command = ${commandNames.map((n) => `${n}Command`).join(' | ')};

`;

  // Generate Zod schemas
  code += `/**
 * Zod validation schemas
 */
export const CBPL_SCHEMAS = {
`;

  for (const [cmdName, cmd] of Object.entries(definitions.commands)) {
    code += `  ${cmdName}: {\n`;
    for (const param of cmd.parameters) {
      let schema = param.type === 'string' ? 'z.string()' : 'z.number()';

      if (param.type === 'number' && param.validation) {
        schema += '.int()';
        if (param.validation.min !== undefined) {
          if (param.validation.min === 0) {
            schema += '.nonnegative()';
          } else {
            schema += `.min(${param.validation.min})`;
          }
        }
        if (param.validation.max !== undefined) {
          schema += `.max(${param.validation.max})`;
        }
      }

      code += `    ${param.name}: ${schema},\n`;
    }
    code += `  },\n`;
  }

  code += `} as const;

`;

  // Export definitions
  code += `/**
 * Runtime command definitions (imported from JSON)
 */
export const CBPL_COMMANDS = definitions.commands;

`;

  // Helper functions
  code += `/**
 * Get command definition by name
 */
export function getCommandDefinition(name: string) {
  return CBPL_COMMANDS[name.toUpperCase() as CBPLCommandName];
}

/**
 * Check if a name is a valid command
 */
export function isValidCommand(name: string): name is CBPLCommandName {
  return COMMAND_NAMES.includes(name.toUpperCase() as CBPLCommandName);
}

/**
 * Validate command parameters
 */
export function validateParameters(
  commandName: CBPLCommandName,
  params: Record<string, any>
): { success: boolean; errors?: string[] } {
  const schemas = CBPL_SCHEMAS[commandName];
  if (!schemas) {
    return { success: false, errors: [\`Unknown command: \${commandName}\`] };
  }

  const errors: string[] = [];
  const command = CBPL_COMMANDS[commandName];

  for (const param of command.parameters) {
    const value = params[param.name];

    if (value === undefined) {
      errors.push(\`Missing required parameter: \${param.name}\`);
      continue;
    }

    const schema = (schemas as any)[param.name];
    if (schema) {
      const result = schema.safeParse(value);
      if (!result.success) {
        errors.push(\`Invalid \${param.name}: \${result.error.message}\`);
      }
    }
  }

  return errors.length > 0 ? { success: false, errors } : { success: true };
}
`;

  return code;
}
