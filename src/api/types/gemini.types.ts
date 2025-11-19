export interface GeminiPart {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiGenerateContentRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

export interface GeminiStreamChunk {
  candidates: Array<{
    content: {
      parts: GeminiPart[];
      role: string;
    };
    finishReason?: string;
    index: number;
  }>;
  promptFeedback?: {
    blockReason?: string;
  };
}
