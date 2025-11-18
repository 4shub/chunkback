/**
 * Cache for storing mocked tool responses
 * Maps tool_call_id to mocked response text
 */

const toolResponseCache = new Map<string, string>();

export function storeMockedResponse(callId: string, response: string): void {
  toolResponseCache.set(callId, response);

  // Auto-expire after 5 minutes to prevent memory leaks
  setTimeout(
    () => {
      toolResponseCache.delete(callId);
    },
    5 * 60 * 1000
  );
}

export function getMockedResponse(callId: string): string | undefined {
  return toolResponseCache.get(callId);
}

export function clearMockedResponse(callId: string): void {
  toolResponseCache.delete(callId);
}
