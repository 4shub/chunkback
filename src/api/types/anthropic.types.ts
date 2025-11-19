export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content:
    | string
    | Array<
        | {
            type: 'text';
            text: string;
          }
        | {
            type: 'tool_use';
            id: string;
            name: string;
            input: Record<string, unknown>;
          }
        | {
            type: 'tool_result';
            tool_use_id: string;
            content: string;
          }
      >;
}

export interface AnthropicMessagesRequest {
  model: string;
  messages: AnthropicMessage[];
  max_tokens: number;
  stream?: boolean;
  temperature?: number;
}

export interface AnthropicStreamChunk {
  type:
    | 'message_start'
    | 'content_block_start'
    | 'content_block_delta'
    | 'content_block_stop'
    | 'message_delta'
    | 'message_stop';
  index?: number;
  delta?: {
    type: 'text_delta' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: string;
  };
  content_block?: {
    type: 'text' | 'tool_use';
    text?: string;
    id?: string;
    name?: string;
    input?: Record<string, unknown>;
  };
  message?: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<unknown>;
    model: string;
    stop_reason: string | null;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}
