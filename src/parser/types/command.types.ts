export type CommandType = 'SAY' | 'CHUNKSIZE' | 'CHUNKLATENCY' | 'TOOLCALL';

// Array of all command types for testing/validation
export const ALL_COMMAND_TYPES: CommandType[] = ['SAY', 'CHUNKSIZE', 'CHUNKLATENCY', 'TOOLCALL'];

export interface SayCommand {
  type: 'SAY';
  content: string;
}

export interface ChunkSizeCommand {
  type: 'CHUNKSIZE';
  size: number;
}

export interface ChunkLatencyCommand {
  type: 'CHUNKLATENCY';
  latency: number;
}

export interface ToolCallCommand {
  type: 'TOOLCALL';
  toolName: string;
  arguments: string;
}

export type Command = SayCommand | ChunkSizeCommand | ChunkLatencyCommand | ToolCallCommand;

export interface ExecutableCommand {
  command: SayCommand | ToolCallCommand;
  chunkSize?: number;
  chunkLatency?: number;
}

export interface ParsedPrompt {
  commands: ExecutableCommand[];
}
