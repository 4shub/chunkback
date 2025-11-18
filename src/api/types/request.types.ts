export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenAIToolMessage {
  role: 'tool';
  content: string;
  tool_call_id: string;
}

export type ChatMessage = OpenAIMessage | OpenAIToolMessage;

export interface OpenAIChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}
