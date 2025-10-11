import { z } from 'zod';

/**
 * Zod validation schemas for CBPL definitions
 */

export const ParameterSchema = z.object({
  name: z.string().min(1, 'Parameter name cannot be empty'),
  type: z.enum(['string', 'number'], {
    errorMap: () => ({ message: 'Parameter type must be "string" or "number"' }),
  }),
  description: z.string().min(1, 'Parameter description cannot be empty'),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
    })
    .optional(),
});

export const CommandDefinitionSchema = z.object({
  name: z.string().min(1, 'Command name cannot be empty'),
  description: z.string().min(1, 'Command description cannot be empty'),
  parameters: z.array(ParameterSchema).min(1, 'Command must have at least one parameter'),
  examples: z.array(z.string()).min(1, 'Command must have at least one example'),
});

export const CBPLDefinitionsSchema = z
  .object({
    $schema: z.string().optional(),
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (e.g., 1.0.0)'),
    commands: z.record(
      z.string().regex(/^[A-Z]+$/, 'Command keys must be uppercase letters only'),
      CommandDefinitionSchema
    ),
  })
  .strict();

/**
 * TypeScript interfaces
 */

export interface Parameter {
  name: string;
  type: 'string' | 'number';
  description: string;
  validation?: {
    min?: number;
    max?: number;
  };
}

export interface CommandDefinition {
  name: string;
  description: string;
  parameters: Parameter[];
  examples: string[];
}

export interface CBPLDefinitions {
  version: string;
  commands: Record<string, CommandDefinition>;
}
