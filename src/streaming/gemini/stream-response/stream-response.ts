import { Response } from 'express';
import { ParsedPrompt } from '../../../parser/types/command.types';
import { createGeminiChunk } from '../create-chunk/create-chunk';
import { chunkString } from '../../shared/chunk-string/chunk-string';

export async function streamGeminiResponse(res: Response, parsed: ParsedPrompt): Promise<void> {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Check if there are any commands
  if (parsed.commands.length === 0) {
    const errorChunk = createGeminiChunk('No valid commands found in prompt', true);
    res.write(JSON.stringify(errorChunk));
    res.end();
    return;
  }

  // Process each command in sequence
  for (let cmdIndex = 0; cmdIndex < parsed.commands.length; cmdIndex++) {
    const execCommand = parsed.commands[cmdIndex];
    const isLastCommand = cmdIndex === parsed.commands.length - 1;

    if (execCommand.command.type === 'TOOLCALL') {
      // Handle TOOLCALL
      const chunk = createGeminiChunk(null, isLastCommand, {
        toolName: execCommand.command.toolName,
        arguments: execCommand.command.arguments,
      });
      res.write(JSON.stringify(chunk));
      if (!isLastCommand) {
        res.write('\n');
      }
    } else if (execCommand.command.type === 'SAY') {
      // Handle SAY with optional CHUNKSIZE and CHUNKLATENCY
      const content = execCommand.command.content;
      const chunkSize = execCommand.chunkSize || content.length;
      const randomLatency = execCommand.randomLatency;

      let chunkLatency = execCommand.chunkLatency || 10;

      if (randomLatency && !execCommand.chunkLatency) {
        const [min, max] = randomLatency;

        chunkLatency = Math.floor(Math.random() * (max - min + 1)) + min;
      }

      const textChunks = chunkString(content, chunkSize);

      // Send chunks
      for (let i = 0; i < textChunks.length; i++) {
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, chunkLatency));
        }
        const chunk = createGeminiChunk(
          textChunks[i],
          i === textChunks.length - 1 && isLastCommand
        );
        res.write(JSON.stringify(chunk));
        if (i < textChunks.length - 1 || !isLastCommand) {
          res.write('\n');
        }
      }
    }
  }

  res.end();
}
