import { Router } from 'express';
import { chatCompletions } from '../chat-completions/chat-completions';
import { anthropicMessages } from '../anthropic-messages/anthropic-messages';
import { geminiGenerate } from '../gemini-generate/gemini-generate';
import { getModels } from '../get-models/get-models';

export function createRouter(): Router {
  const router = Router();

  // OpenAI-compatible chat completions endpoint
  router.post('/v1/chat/completions', chatCompletions);

  // Anthropic-compatible messages endpoint
  router.post('/v1/messages', anthropicMessages);

  // Gemini-compatible generateContent endpoint
  router.post('/v1/models/:model/generateContent', geminiGenerate);
  router.post('/v1beta/models/:model/generateContent', geminiGenerate);

  // Models endpoint - returns fake models list based on provider headers
  // OpenAI, Anthropic, and Gemini all use /v1/models
  router.get('/v1/models', getModels);
  // Gemini also supports /v1beta/models
  router.get('/v1beta/models', getModels);

  return router;
}
