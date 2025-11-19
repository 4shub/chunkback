import { Request, Response } from 'express';
import { GeminiGenerateContentRequest } from '../types/gemini.types';
import { parsePrompt } from '../../parser/parse-prompt/parse-prompt';
import { streamGeminiResponse } from '../../streaming/gemini/stream-response/stream-response';
import { getMockedResponse } from '../../streaming/shared/tool-response-cache/tool-response-cache';
import { createGeminiChunk } from '../../streaming/gemini/create-chunk/create-chunk';
import { chunkString } from '../../streaming/shared/chunk-string/chunk-string';

export async function geminiGenerate(req: Request, res: Response): Promise<void> {
  try {
    const body = req.body as GeminiGenerateContentRequest;

    // Validate request
    if (!body.contents || body.contents.length === 0) {
      res.status(400).json({ error: 'Contents array is required' });
      return;
    }

    // Check if this is a follow-up request with function response
    const lastContent = body.contents[body.contents.length - 1];
    const hasFunctionResponse = lastContent.parts.some((part) => part.functionResponse);

    if (hasFunctionResponse) {
      // Find the function call ID from the previous model response
      // In Gemini, the function response includes the function name
      const functionResponsePart = lastContent.parts.find((part) => part.functionResponse);

      if (functionResponsePart && functionResponsePart.functionResponse) {
        // For Gemini, we need to find the corresponding function call from history
        // Look through contents to find the model's function call
        let functionCallId: string | undefined;

        for (let i = body.contents.length - 2; i >= 0; i--) {
          const content = body.contents[i];
          if (content.role === 'model') {
            const functionCallPart = content.parts.find((part) => part.functionCall);
            if (functionCallPart && functionCallPart.functionCall) {
              // Use function name as ID since Gemini doesn't have explicit IDs
              functionCallId = functionResponsePart.functionResponse.name;
              break;
            }
          }
        }

        if (functionCallId) {
          const mockedResponse = await getMockedResponse(functionCallId);

          if (mockedResponse) {
            // Stream the mocked response
            res.setHeader('Content-Type', 'application/json');

            const chunks = chunkString(mockedResponse, 10);

            for (let i = 0; i < chunks.length; i++) {
              const chunk = createGeminiChunk(chunks[i], i === chunks.length - 1);
              res.write(JSON.stringify(chunk));
              if (i < chunks.length - 1) {
                res.write('\n');
                await new Promise((resolve) => setTimeout(resolve, 10));
              }
            }

            res.end();
            return;
          }
        }
      }
    }

    // Get the last user message as the prompt
    const userContents = body.contents.filter((c) => c.role === 'user');
    if (userContents.length === 0) {
      res.status(400).json({ error: 'At least one user content is required' });
      return;
    }

    const lastUserContent = userContents[userContents.length - 1];
    const prompt = lastUserContent.parts
      .map((part) => part.text || '')
      .filter((text) => text.length > 0)
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
