import { Request, Response } from 'express';
import { AnthropicMessagesRequest } from '../types/anthropic.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamAnthropicResponse } from '../../streaming/anthropic/stream-response/stream-response';

export async function anthropicMessages(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as AnthropicMessagesRequest;

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

    const lastMessage = userMessages[userMessages.length - 1];
    const prompt = typeof lastMessage.content === 'string'
      ? lastMessage.content
      : lastMessage.content.map(c => c.text).join('\n');

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
