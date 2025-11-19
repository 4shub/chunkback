import { AnthropicStreamChunk } from '../../../api/types/anthropic.types';

export function createAnthropicChunk(
  content: string | null,
  isFirst: boolean = false,
  isLast: boolean = false,
  toolCall?: { toolName: string; arguments: string; toolUseId?: string }
): AnthropicStreamChunk[] {
  const chunks: AnthropicStreamChunk[] = [];

  if (isFirst) {
    // Message start
    chunks.push({
      type: 'message_start',
      message: {
        id: `msg_${Date.now()}`,
        type: 'message',
        role: 'assistant',
        content: [],
        model: 'echo-model',
        stop_reason: null,
        stop_sequence: null,
        usage: {
          input_tokens: 0,
          output_tokens: 0,
        },
      },
    });

    // Content block start
    chunks.push({
      type: 'content_block_start',
      index: 0,
      content_block: toolCall
        ? {
            type: 'tool_use',
            id: toolCall.toolUseId || `toolu_${Date.now()}`,
            name: toolCall.toolName,
            input: {},
          }
        : {
            type: 'text',
            text: '',
          },
    });
  }

  // Content delta
  if (content !== null && !toolCall) {
    chunks.push({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'text_delta',
        text: content,
      },
    });
  }

  if (toolCall && isFirst) {
    chunks.push({
      type: 'content_block_delta',
      index: 0,
      delta: {
        type: 'tool_use',
        input: toolCall.arguments,
      },
    });
  }

  if (isLast) {
    // Content block stop
    chunks.push({
      type: 'content_block_stop',
      index: 0,
    });

    // Message stop
    chunks.push({
      type: 'message_stop',
    });
  }

  return chunks;
}
