import { Command, SayCommand, ChunkSizeCommand, ChunkLatencyCommand, ToolCallCommand } from '../types/command.types';

export function parseCommand(prompt: string): Command | null {
  // Parse SAY command: SAY "content"
  const sayMatch = prompt.match(/^SAY\s+"([^"]*)"/);
  if (sayMatch) {
    return {
      type: 'SAY',
      content: sayMatch[1]
    } as SayCommand;
  }

  // Parse CHUNKSIZE command: CHUNKSIZE number
  const chunkSizeMatch = prompt.match(/^CHUNKSIZE\s+(\d+)/);
  if (chunkSizeMatch) {
    return {
      type: 'CHUNKSIZE',
      size: parseInt(chunkSizeMatch[1], 10)
    } as ChunkSizeCommand;
  }

  // Parse CHUNKLATENCY command: CHUNKLATENCY number
  const chunkLatencyMatch = prompt.match(/^CHUNKLATENCY\s+(\d+)/);
  if (chunkLatencyMatch) {
    return {
      type: 'CHUNKLATENCY',
      latency: parseInt(chunkLatencyMatch[1], 10)
    } as ChunkLatencyCommand;
  }

  // Parse TOOLCALL command: TOOLCALL "toolName" "arguments"
  const toolCallMatch = prompt.match(/^TOOLCALL\s+"([^"]*)"\s+"([^"]*)"/);
  if (toolCallMatch) {
    return {
      type: 'TOOLCALL',
      toolName: toolCallMatch[1],
      arguments: toolCallMatch[2]
    } as ToolCallCommand;
  }

  return null;
}
