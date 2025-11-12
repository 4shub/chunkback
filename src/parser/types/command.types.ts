/**
 * Command Types
 *
 * ⚠️  Types are auto-generated from cbpl.definitions.json
 * Run 'pnpm codegen' to regenerate after changing definitions
 */

import {
  CBPLCommandName,
  COMMAND_NAMES,
  SAYCommand,
  TOOLCALLCommand,
  CHUNKSIZECommand,
  CHUNKLATENCYCommand,
  Command as GeneratedCommand,
} from '../definitions/cbpl.generated';

/**
 * Command type - auto-generated from CBPL definitions
 */
export type CommandType = CBPLCommandName;

/**
 * Array of all command types - auto-generated from CBPL definitions
 */
export const ALL_COMMAND_TYPES: CommandType[] = [...COMMAND_NAMES];

/**
 * SAY command - auto-generated from definitions
 */
export type SayCommand = SAYCommand;

/**
 * CHUNKSIZE command - auto-generated from definitions
 */
export type ChunkSizeCommand = CHUNKSIZECommand;

/**
 * CHUNKLATENCY command - auto-generated from definitions
 */
export type ChunkLatencyCommand = CHUNKLATENCYCommand;

/**
 * TOOLCALL command - auto-generated from definitions
 */
export type ToolCallCommand = TOOLCALLCommand;

/**
 * All possible command types - auto-generated from definitions
 */
export type Command = GeneratedCommand;

/**
 * Executable command with optional chunk configuration
 */
export interface ExecutableCommand {
  command: SayCommand | ToolCallCommand;
  chunkSize?: number;
  chunkLatency?: number;
  randomLatency?: [number, number];
}

/**
 * Parsed prompt result
 */
export interface ParsedPrompt {
  commands: ExecutableCommand[];
}
