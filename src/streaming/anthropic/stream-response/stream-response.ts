import { Response } from 'express';
import { ParsedPrompt } from '../../../parser/types/command.types';
import { createAnthropicChunk } from '../create-chunk/create-chunk';
import { chunkString } from '../../shared/chunk-string/chunk-string';

export async function streamAnthropicResponse(res: Response, parsed: ParsedPrompt): Promise<void> {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Check if there are any commands
  if (parsed.commands.length === 0) {
    const errorChunks = createAnthropicChunk('No valid commands found in prompt', true, true);
    for (const chunk of errorChunks) {
      res.write(`event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`);
    }
    res.end();
    return;
  }

  let isFirstChunk = true;
  let currentBlockType: 'text' | 'tool' | null = null;
  let contentBlockIndex = 0;

  // Process each command in sequence
  for (let cmdIndex = 0; cmdIndex < parsed.commands.length; cmdIndex++) {
    const execCommand = parsed.commands[cmdIndex];
    const isLastCommand = cmdIndex === parsed.commands.length - 1;

    if (execCommand.command.type === 'TOOLCALL') {
      // If we were in a text block, close it first
      if (currentBlockType === 'text') {
        res.write(`event: content_block_stop\ndata: ${JSON.stringify({ type: 'content_block_stop', index: contentBlockIndex })}\n\n`);
        contentBlockIndex++;
      }

      // Handle TOOLCALL - always start a new block for tools
      const needsBlockStart = isFirstChunk || currentBlockType === 'text';
      const chunks = createAnthropicChunk(null, needsBlockStart, isLastCommand, {
        toolName: execCommand.command.toolName,
        arguments: execCommand.command.arguments
      });

      // Update indices for tool block
      for (const chunk of chunks) {
        if (chunk.type === 'content_block_start' || chunk.type === 'content_block_delta' || chunk.type === 'content_block_stop') {
          chunk.index = contentBlockIndex;
        }
        res.write(`event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`);
      }

      isFirstChunk = false;
      currentBlockType = 'tool';
    } else if (execCommand.command.type === 'SAY') {
      // If this is the first SAY or we just finished a tool call, start a new text block
      if (currentBlockType === 'tool') {
        contentBlockIndex++;
        currentBlockType = null;
      }

      // Handle SAY with optional CHUNKSIZE and CHUNKLATENCY
      const content = execCommand.command.content;
      const chunkSize = execCommand.chunkSize || content.length;
      const chunkLatency = execCommand.chunkLatency || 10;

      const textChunks = chunkString(content, chunkSize);

      // Check if we need to open a new text block
      const needsBlockStart = currentBlockType !== 'text';

      // Send first chunk
      const firstChunks = createAnthropicChunk(
        textChunks[0],
        isFirstChunk || needsBlockStart,
        textChunks.length === 1 && isLastCommand
      );

      // Update indices
      for (const chunk of firstChunks) {
        if (chunk.type === 'content_block_start' || chunk.type === 'content_block_delta' || chunk.type === 'content_block_stop') {
          chunk.index = contentBlockIndex;
        }
        res.write(`event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`);
      }

      isFirstChunk = false;
      currentBlockType = 'text';

      // Send remaining chunks
      for (let i = 1; i < textChunks.length; i++) {
        await new Promise(resolve => setTimeout(resolve, chunkLatency));
        const chunks = createAnthropicChunk(
          textChunks[i],
          false,
          i === textChunks.length - 1 && isLastCommand
        );

        // Update indices
        for (const chunk of chunks) {
          if (chunk.type === 'content_block_delta' || chunk.type === 'content_block_stop') {
            chunk.index = contentBlockIndex;
          }
          res.write(`event: ${chunk.type}\ndata: ${JSON.stringify(chunk)}\n\n`);
        }
      }
    }
  }

  res.end();
}
