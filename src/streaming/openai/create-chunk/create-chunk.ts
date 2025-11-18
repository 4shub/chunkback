import { StreamChunk } from '../types/streaming.types';

export function createChunk(
  content: string | null,
  isFirst: boolean = false,
  isLast: boolean = false,
  toolCall?: { toolName: string; arguments: string; isFirstToolChunk?: boolean; callId?: string }
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

  if (isFirst) {
    chunk.choices[0].delta.role = 'assistant';
  }

  if (content !== null) {
    chunk.choices[0].delta.content = content;
  }

  if (toolCall) {
    const isFirstToolChunk = toolCall.isFirstToolChunk ?? true;
    const callId = toolCall.callId || `call_${Date.now()}`;

    if (isFirstToolChunk) {
      // First chunk: include full tool call structure with name, id, type
      chunk.choices[0].delta.tool_calls = [
        {
          index: 0,
          id: callId,
          type: 'function',
          function: {
            name: toolCall.toolName,
            arguments: toolCall.arguments,
          },
        },
      ];
    } else {
      // Delta chunk: only include arguments
      chunk.choices[0].delta.tool_calls = [
        {
          index: 0,
          function: {
            arguments: toolCall.arguments,
          },
        },
      ];
    }

    if (isLast) {
      chunk.choices[0].finish_reason = 'tool_calls';
    }
  }

  return chunk;
}
