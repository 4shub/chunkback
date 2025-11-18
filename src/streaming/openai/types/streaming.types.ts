export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
      tool_calls?: Array<{
        index: number;
        id?: string;
        type?: string;
        function: {
          name?: string;
          arguments: string;
        };
      }>;
    };
    finish_reason: string | null;
  }>;
}
