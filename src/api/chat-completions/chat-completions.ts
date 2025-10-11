import { Request, Response } from 'express';
import { OpenAIChatCompletionRequest } from '../types/request.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamResponse } from '../../streaming/openai/stream-response/stream-response';

export async function chatCompletions(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as OpenAIChatCompletionRequest;

    // Validate request
    if (!body.messages || body.messages.length === 0) {
      res.status(400).json({ error: 'Messages array is required' });
      return;
    }

    // Get the last user message as the prompt
    const userMessages = body.messages.filter(msg => msg.role === 'user');
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
