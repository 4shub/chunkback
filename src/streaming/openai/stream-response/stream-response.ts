import { Response } from 'express';
import { ParsedPrompt } from '../../../parser/types/command.types';
import { createChunk } from '../create-chunk/create-chunk';
import { chunkString } from '../../shared/chunk-string/chunk-string';
import { storeMockedResponse } from '../../shared/tool-response-cache/tool-response-cache';
import { nanoid } from 'nanoid';

export async function streamResponse(res: Response, parsed: ParsedPrompt): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Check if there are any commands
  if (parsed.commands.length === 0) {
    const errorChunk = createChunk('No valid commands found in prompt', true, true);
    res.write(`data: ${JSON.stringify(errorChunk)}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  let isFirstChunk = true;

  // Process each command in sequence
  for (let cmdIndex = 0; cmdIndex < parsed.commands.length; cmdIndex++) {
    const execCommand = parsed.commands[cmdIndex];
    const isLastCommand = cmdIndex === parsed.commands.length - 1;

    if (execCommand.command.type === 'TOOLCALL') {
      // Handle TOOLCALL - stream arguments incrementally
      const toolName = execCommand.command.toolName;
      const argumentsStr = execCommand.command.arguments;
      const mockedResponse = execCommand.command.mockedResponse;
      const chunkSize = execCommand.chunkSize || 5; // Default to 5 chars per chunk for tool calls
      const chunkLatency = execCommand.chunkLatency || 10;

      const argumentChunks = chunkString(argumentsStr, chunkSize);

      // Generate call ID (UUID + timestamp for uniqueness)
      const callId = `call_${nanoid(12)}`;

      // Store mocked response (always required)
      storeMockedResponse(callId, mockedResponse);

      // Send first chunk with tool name and initial arguments
      const firstToolChunk = createChunk(
        null,
        isFirstChunk,
        argumentChunks.length === 1 && isLastCommand,
        {
          toolName: toolName,
          arguments: argumentChunks[0],
          isFirstToolChunk: true,
          callId: callId,
        }
      );
      res.write(`data: ${JSON.stringify(firstToolChunk)}\n\n`);
      isFirstChunk = false;

      // Send remaining argument chunks as deltas
      for (let i = 1; i < argumentChunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, chunkLatency));
        const chunk = createChunk(null, false, i === argumentChunks.length - 1 && isLastCommand, {
          toolName: toolName,
          arguments: argumentChunks[i],
          isFirstToolChunk: false,
          callId: callId,
        });
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
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

      const chunks = chunkString(content, chunkSize);

      // Send first chunk
      const firstChunk = createChunk(chunks[0], isFirstChunk, chunks.length === 1 && isLastCommand);
      res.write(`data: ${JSON.stringify(firstChunk)}\n\n`);
      isFirstChunk = false;

      // Send remaining chunks
      for (let i = 1; i < chunks.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, chunkLatency));
        const chunk = createChunk(chunks[i], false, i === chunks.length - 1 && isLastCommand);
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    }
  }

  res.write('data: [DONE]\n\n');
  res.end();
}
