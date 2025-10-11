import { Request, Response } from 'express';
import { GeminiGenerateContentRequest } from '../types/gemini.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamGeminiResponse } from '../../streaming/gemini/stream-response/stream-response';

export async function geminiGenerate(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as GeminiGenerateContentRequest;

    // Validate request
    if (!body.contents || body.contents.length === 0) {
      res.status(400).json({ error: 'Contents array is required' });
      return;
    }

    // Get the last user message as the prompt
    const userContents = body.contents.filter(c => c.role === 'user');
    if (userContents.length === 0) {
      res.status(400).json({ error: 'At least one user content is required' });
      return;
    }

    const lastContent = userContents[userContents.length - 1];
    const prompt = lastContent.parts
      .map(part => part.text || '')
      .filter(text => text.length > 0)
      .join('\n');

    // Parse the prompt
    const parsed = parsePrompt(prompt);

    // Stream the response
    await streamGeminiResponse(res, parsed);
  } catch (error) {
    console.error('Error in Gemini generate:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
