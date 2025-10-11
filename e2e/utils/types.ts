import { CommandType, ALL_COMMAND_TYPES } from '../../src/parser/types/command.types';

// Re-export for convenience
export type CommandVerb = CommandType;
export const ALL_VERBS = ALL_COMMAND_TYPES;

export interface TestCase {
  name: string;
  prompt: string;
  verbs: CommandVerb[];
  expectedContent?: string;
  expectedToolName?: string;
}
