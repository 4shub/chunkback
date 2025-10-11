import { Router } from 'express';
import { chatCompletions } from '../chat-completions/chat-completions';
import { anthropicMessages } from '../anthropic-messages/anthropic-messages';
import { geminiGenerate } from '../gemini-generate/gemini-generate';

export function createRouter(): Router {
  const router = Router();

  // OpenAI-compatible chat completions endpoint
  router.post('/v1/chat/completions', chatCompletions);

  // Anthropic-compatible messages endpoint
  router.post('/v1/messages', anthropicMessages);

  // Gemini-compatible generateContent endpoint
  router.post('/v1/models/:model/generateContent', geminiGenerate);
  router.post('/v1beta/models/:model/generateContent', geminiGenerate);

  return router;
}
