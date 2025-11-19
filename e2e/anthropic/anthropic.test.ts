import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer } from '../utils/server';
import { testCases } from '../utils/test-cases';
import { validateVerbCoverage, collectTestedVerbs } from '../utils/coverage-validator';

describe('Anthropic Endpoint E2E Tests', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startTestServer(3002);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // Test each verb individually
  testCases.forEach((testCase) => {
    it(testCase.name, async () => {
      const response = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'echo-model',
          max_tokens: 1024,
          messages: [{ role: 'user', content: testCase.prompt }],
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const text = await response.text();

      // Parse SSE format: event lines followed by data lines
      const lines = text.split('\n');
      const chunks: unknown[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('data: ')) {
          const jsonStr = lines[i].replace('data: ', '');
          try {
            chunks.push(JSON.parse(jsonStr));
          } catch {
            // Skip invalid JSON
          }
        }
      }

      expect(chunks.length).toBeGreaterThan(0);

      // Verify structure - should have message_start
      const messageStart = chunks.find((chunk) => chunk.type === 'message_start');
      expect(messageStart).toBeDefined();
      expect(messageStart?.message).toHaveProperty('role', 'assistant');

      // Should have content_block_start
      const blockStart = chunks.find((chunk) => chunk.type === 'content_block_start');
      expect(blockStart).toBeDefined();

      // Should have message_stop
      const messageStop = chunks.find((chunk) => chunk.type === 'message_stop');
      expect(messageStop).toBeDefined();

      // Verify content or tool call
      if (testCase.expectedContent) {
        const contentDeltas = chunks
          .filter(
            (chunk) => chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta'
          )
          .map((chunk) => chunk.delta?.text || '');
        const fullContent = contentDeltas.join('');
        expect(fullContent).toBe(testCase.expectedContent);
      }

      if (testCase.expectedToolName) {
        const toolBlock = chunks.find(
          (chunk) =>
            chunk.type === 'content_block_start' && chunk.content_block?.type === 'tool_use'
        );
        expect(toolBlock).toBeDefined();
        expect(toolBlock?.content_block?.name).toBe(testCase.expectedToolName);
      }
    });
  });

  // Test complete tool calling flow with follow-up
  it('should handle tool call flow with follow-up request', async () => {
    // Step 1: Send initial request with TOOLCALL
    const initialResponse = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'echo-model',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content:
              'TOOLCALL "get_weather" {"location": "San Francisco"} "The weather is 72°F and sunny"',
          },
        ],
      }),
    });

    expect(initialResponse.ok).toBe(true);
    const initialText = await initialResponse.text();

    // Parse SSE format
    const initialLines = initialText.split('\n');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const initialChunks: any[] = [];

    for (let i = 0; i < initialLines.length; i++) {
      if (initialLines[i].startsWith('data: ')) {
        const jsonStr = initialLines[i].replace('data: ', '');
        try {
          initialChunks.push(JSON.parse(jsonStr));
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Extract tool_use_id from initial response
    const toolBlock = initialChunks.find(
      (chunk) => chunk.type === 'content_block_start' && chunk.content_block?.type === 'tool_use'
    );

    expect(toolBlock).toBeDefined();
    expect(toolBlock.content_block.name).toBe('get_weather');
    const toolUseId = toolBlock.content_block.id;
    expect(toolUseId).toBeDefined();

    // Step 2: Send follow-up request with tool result
    const followUpResponse = await fetch(`${baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'echo-model',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content:
              'TOOLCALL "get_weather" {"location": "San Francisco"} "The weather is 72°F and sunny"',
          },
          {
            role: 'assistant',
            content: [
              {
                type: 'tool_use',
                id: toolUseId,
                name: 'get_weather',
                input: { location: 'San Francisco' },
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'tool_result',
                tool_use_id: toolUseId,
                content: 'Current weather data',
              },
            ],
          },
        ],
      }),
    });

    expect(followUpResponse.ok).toBe(true);
    const followUpText = await followUpResponse.text();

    // Parse SSE format
    const followUpLines = followUpText.split('\n');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const followUpChunks: any[] = [];

    for (let i = 0; i < followUpLines.length; i++) {
      if (followUpLines[i].startsWith('data: ')) {
        const jsonStr = followUpLines[i].replace('data: ', '');
        try {
          followUpChunks.push(JSON.parse(jsonStr));
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Verify mocked response is returned
    const contentDeltas = followUpChunks
      .filter((chunk) => chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta')
      .map((chunk) => chunk.delta?.text || '');

    const mockedContent = contentDeltas.join('');
    expect(mockedContent).toBe('The weather is 72°F and sunny');
  });

  // Validate verb coverage
  it('should test all verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'Anthropic E2E Tests');
  });
});
