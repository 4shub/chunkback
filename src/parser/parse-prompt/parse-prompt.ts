import { ParsedPrompt, ExecutableCommand } from '../types/command.types';
import { parseCommand } from '../parse-command/parse-command';

export function parsePrompt(prompt: string): ParsedPrompt {
  const commands: ExecutableCommand[] = [];
  let currentChunkSize: number | undefined;
  let currentChunkLatency: number | undefined;

  // Split by newlines and process each line
  const lines = prompt.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  for (const line of lines) {
    const command = parseCommand(line);

    if (command) {
      switch (command.type) {
        case 'SAY':
          commands.push({
            command,
            chunkSize: currentChunkSize,
            chunkLatency: currentChunkLatency
          });
          break;
        case 'TOOLCALL':
          commands.push({
            command,
            chunkSize: currentChunkSize,
            chunkLatency: currentChunkLatency
          });
          break;
        case 'CHUNKSIZE':
          currentChunkSize = command.size;
          break;
        case 'CHUNKLATENCY':
          currentChunkLatency = command.latency;
          break;
      }
    }
  }

  return { commands };
}
