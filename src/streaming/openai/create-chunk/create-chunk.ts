import { StreamChunk } from '../types/streaming.types';

export function createChunk(
  content: string | null,
  isFirst: boolean = false,
  isLast: boolean = false,
  toolCall?: { toolName: string; arguments: string }
): StreamChunk {
  const chunk: StreamChunk = {
    id: `chatcmpl-${Date.now()}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'echo-model',
    choices: [
      {
        index: 0,
        delta: {},
        finish_reason: isLast ? 'stop' : null,
      },
    ],
  };

  if (isFirst && !toolCall) {
    chunk.choices[0].delta.role = 'assistant';
  }

  if (content !== null) {
    chunk.choices[0].delta.content = content;
  }

  if (toolCall) {
    chunk.choices[0].delta.tool_calls = [
      {
        index: 0,
        id: `call_${Date.now()}`,
        type: 'function',
        function: {
          name: toolCall.toolName,
          arguments: toolCall.arguments,
        },
      },
    ];
    chunk.choices[0].finish_reason = 'tool_calls';
  }

  return chunk;
}
