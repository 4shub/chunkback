import { Request, Response } from 'express';
import { OpenAIChatCompletionRequest, OpenAIToolMessage } from '../types/request.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamResponse } from '../../streaming/openai/stream-response/stream-response';
import { getMockedResponse } from '../../streaming/shared/tool-response-cache/tool-response-cache';
import { createChunk } from '../../streaming/openai/create-chunk/create-chunk';
import { chunkString } from '../../streaming/shared/chunk-string/chunk-string';

export async function chatCompletions(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as OpenAIChatCompletionRequest;

    // Validate request
    if (!body.messages || body.messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Check if this is a follow-up request with tool results
    const toolMessages = body.messages.filter(
      (msg): msg is OpenAIToolMessage => msg.role === 'tool'
    );
    if (toolMessages.length > 0) {
      // This is a follow-up request - return the mocked response
      const toolMessage = toolMessages[toolMessages.length - 1];
      const mockedResponse = getMockedResponse(toolMessage.tool_call_id);

      if (mockedResponse) {
        // Stream the mocked response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const chunks = chunkString(mockedResponse, 10);
        let isFirstChunk = true;

        for (let i = 0; i < chunks.length; i++) {
          const chunk = createChunk(chunks[i], isFirstChunk, i === chunks.length - 1);
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
          isFirstChunk = false;
          if (i < chunks.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    // Get the last user message as the prompt
    const userMessages = body.messages.filter((msg) => msg.role === 'user');
    if (userMessages.length === 0) {
      res.status(400).json({ error: 'At least one user message is required' });
      return;
    }

    const prompt = userMessages[userMessages.length - 1].content;

    // Parse the prompt
    const parsed = parsePrompt(prompt);

    // Stream the response
    await streamResponse(res, parsed);
  } catch (error) {
    console.error('Error in chat completions:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
