/**
 * CBPL Generated Types
 *
 * ⚠️  AUTO-GENERATED - DO NOT EDIT MANUALLY
 * Generated from: cbpl.definitions.json
 * Run 'pnpm codegen' to regenerate
 */

import { z } from 'zod';
import definitions from '../../../cbpl.definitions.json';

/**
 * Command names
 */
export type CBPLCommandName = 'SAY' | 'TOOLCALL' | 'CHUNKSIZE' | 'CHUNKLATENCY' | 'RANDOMLATENCY';

/**
 * All command names
 */
export const COMMAND_NAMES: CBPLCommandName[] = [
  'SAY',
  'TOOLCALL',
  'CHUNKSIZE',
  'CHUNKLATENCY',
  'RANDOMLATENCY',
];

/**
 * Outputs text content as a streaming response
 */
export interface SAYCommand {
  type: 'SAY';
  content: string;
}

/**
 * Invokes a tool/function with specified arguments as a JSON object. Optionally specify a mocked response to complete the tool calling flow.
 */
export interface TOOLCALLCommand {
  type: 'TOOLCALL';
  toolName: string;
  arguments: string;
  mockedResponse: string;
}

/**
 * Sets the chunk size for subsequent SAY statements
 */
export interface CHUNKSIZECommand {
  type: 'CHUNKSIZE';
  size: number;
}

/**
 * Sets the delay in milliseconds between chunks
 */
export interface CHUNKLATENCYCommand {
  type: 'CHUNKLATENCY';
  latency: number;
}

/**
 * Sets a random delay in milliseconds between chunks
 */
export interface RANDOMLATENCYCommand {
  type: 'RANDOMLATENCY';
  minLatency: number;
  maxLatency: number;
}

/**
 * All command types
 */
export type Command =
  | SAYCommand
  | TOOLCALLCommand
  | CHUNKSIZECommand
  | CHUNKLATENCYCommand
  | RANDOMLATENCYCommand;

/**
 * Zod validation schemas
 */
export const CBPL_SCHEMAS = {
  SAY: {
    content: z.string(),
  },
  TOOLCALL: {
    toolName: z.string(),
    arguments: z.string(),
    mockedResponse: z.string(),
  },
  CHUNKSIZE: {
    size: z.number().int().min(1).max(1000),
  },
  CHUNKLATENCY: {
    latency: z.number().int().nonnegative().max(10000),
  },
  RANDOMLATENCY: {
    minLatency: z.number().int().nonnegative().max(10000),
    maxLatency: z.number().int().nonnegative().max(10000),
  },
} as const;

/**
 * Runtime command definitions (imported from JSON)
 */
export const CBPL_COMMANDS = definitions.commands;

/**
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
  params: Record<string, unknown>
): { success: boolean; errors?: string[] } {
  const schemas = CBPL_SCHEMAS[commandName];
  if (!schemas) {
    return { success: false, errors: [`Unknown command: ${commandName}`] };
  }

  const errors: string[] = [];
  const command = CBPL_COMMANDS[commandName];

  for (const param of command.parameters) {
    const value = params[param.name];

    if (value === undefined) {
      errors.push(`Missing required parameter: ${param.name}`);
      continue;
    }

    const schema = (schemas as Record<string, z.ZodType>)[param.name];
    if (schema) {
      const result = schema.safeParse(value);
      if (!result.success) {
        errors.push(`Invalid ${param.name}: ${result.error.message}`);
      }
    }
  }

  return errors.length > 0 ? { success: false, errors } : { success: true };
}
