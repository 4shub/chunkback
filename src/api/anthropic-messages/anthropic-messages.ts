import { Request, Response } from 'express';
import { AnthropicMessagesRequest } from '../types/anthropic.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamAnthropicResponse } from '../../streaming/anthropic/stream-response/stream-response';
import { getMockedResponse } from '../../streaming/shared/tool-response-cache/tool-response-cache';
import { createAnthropicChunk } from '../../streaming/anthropic/create-chunk/create-chunk';
import { chunkString } from '../../streaming/shared/chunk-string/chunk-string';

export async function anthropicMessages(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as AnthropicMessagesRequest;

    // Validate request
    if (!body.messages || body.messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Check if this is a follow-up request with tool results
    const lastMessage = body.messages[body.messages.length - 1];
    const hasToolResult =
      lastMessage.role === 'user' &&
      Array.isArray(lastMessage.content) &&
      lastMessage.content.some((block) => block.type === 'tool_result');

    if (hasToolResult && Array.isArray(lastMessage.content)) {
      // Extract tool_use_id from tool_result
      const toolResultBlock = lastMessage.content.find((block) => block.type === 'tool_result');
      if (toolResultBlock && 'tool_use_id' in toolResultBlock) {
        const mockedResponse = await getMockedResponse(toolResultBlock.tool_use_id);

        if (mockedResponse) {
          // Stream the mocked response
          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          const chunks = chunkString(mockedResponse, 10);
          let isFirstChunk = true;

          for (let i = 0; i < chunks.length; i++) {
            const chunkEvents = createAnthropicChunk(
              chunks[i],
              isFirstChunk,
              i === chunks.length - 1
            );
            for (const event of chunkEvents) {
              res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
            }
            isFirstChunk = false;
            if (i < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
          }

          res.end();
          return;
        }
      }
    }

    // Get the last user message as the prompt
    const userMessages = body.messages.filter((msg) => msg.role === 'user');
    if (userMessages.length === 0) {
      res.status(400).json({ error: 'At least one user message is required' });
      return;
    }

    const lastUserMessage = userMessages[userMessages.length - 1];
    const prompt =
      typeof lastUserMessage.content === 'string'
        ? lastUserMessage.content
        : lastUserMessage.content
            .filter((block) => block.type === 'text' && 'text' in block)
            .map((block) => ('text' in block ? block.text : ''))
            .join('\n');

    // Parse the prompt
    const parsed = parsePrompt(prompt);

    // Stream the response
    await streamAnthropicResponse(res, parsed);
  } catch (error) {
    console.error('Error in Anthropic messages:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
