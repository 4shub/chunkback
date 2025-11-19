import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer } from '../utils/server';
import { testCases } from '../utils/test-cases';
import { validateVerbCoverage, collectTestedVerbs } from '../utils/coverage-validator';

describe('OpenAI Endpoint E2E Tests', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startTestServer(3001);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // Test each verb individually
  testCases.forEach((testCase) => {
    it(testCase.name, async () => {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'echo-model',
          messages: [{ role: 'user', content: testCase.prompt }],
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const text = await response.text();
      const lines = text.split('\n').filter((line) => line.startsWith('data: '));

      // Should have at least one data line and [DONE]
      expect(lines.length).toBeGreaterThan(0);
      expect(text).toContain('data: [DONE]');

      // Parse chunks
      const chunks = lines
        .filter((line) => !line.includes('[DONE]'))
        .map((line) => {
          const jsonStr = line.replace('data: ', '');
          return JSON.parse(jsonStr);
        });

      expect(chunks.length).toBeGreaterThan(0);

      // Verify structure
      const firstChunk = chunks[0];
      expect(firstChunk).toHaveProperty('id');
      expect(firstChunk).toHaveProperty('object', 'chat.completion.chunk');
      expect(firstChunk).toHaveProperty('choices');
      expect(firstChunk.choices[0]).toHaveProperty('delta');

      // Verify content or tool call
      if (testCase.expectedContent) {
        const fullContent = chunks.map((chunk) => chunk.choices[0]?.delta?.content || '').join('');
        expect(fullContent).toBe(testCase.expectedContent);
      }

      if (testCase.expectedToolName) {
        const toolCalls = chunks.flatMap((chunk) => chunk.choices[0]?.delta?.tool_calls || []);
        expect(toolCalls.length).toBeGreaterThan(0);
        expect(toolCalls[0].function.name).toBe(testCase.expectedToolName);
      }
    });
  });

  // Test complete tool calling flow with follow-up
  it('should handle tool call flow with follow-up request', async () => {
    // Step 1: Send initial request with TOOLCALL
    const initialResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'echo-model',
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
    const initialLines = initialText.split('\n').filter((line) => line.startsWith('data: '));

    const initialChunks = initialLines
      .filter((line) => !line.includes('[DONE]'))
      .map((line) => JSON.parse(line.replace('data: ', '')));

    // Extract tool_call_id from initial response
    let toolCallId: string | undefined;
    let toolName: string | undefined;
    let toolArguments = '';

    for (const chunk of initialChunks) {
      const toolCalls = chunk.choices?.[0]?.delta?.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        if (toolCalls[0].id) {
          toolCallId = toolCalls[0].id;
        }
        if (toolCalls[0].function?.name) {
          toolName = toolCalls[0].function.name;
        }
        if (toolCalls[0].function?.arguments) {
          toolArguments += toolCalls[0].function.arguments;
        }
      }
    }

    expect(toolCallId).toBeDefined();
    expect(toolName).toBe('get_weather');
    expect(toolArguments).toBe('{"location": "San Francisco"}');

    // Verify finish_reason is 'tool_calls'
    const lastChunk = initialChunks[initialChunks.length - 1];
    expect(lastChunk.choices[0].finish_reason).toBe('tool_calls');

    // Step 2: Send follow-up request with tool result
    const followUpResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'echo-model',
        messages: [
          {
            role: 'user',
            content:
              'TOOLCALL "get_weather" {"location": "San Francisco"} "The weather is 72°F and sunny"',
          },
          {
            role: 'assistant',
            content: null,
            tool_calls: [
              {
                id: toolCallId,
                type: 'function',
                function: {
                  name: 'get_weather',
                  arguments: '{"location": "San Francisco"}',
                },
              },
            ],
          },
          {
            role: 'tool',
            tool_call_id: toolCallId,
            content: 'Current weather data',
          },
        ],
      }),
    });

    expect(followUpResponse.ok).toBe(true);
    const followUpText = await followUpResponse.text();
    const followUpLines = followUpText.split('\n').filter((line) => line.startsWith('data: '));

    const followUpChunks = followUpLines
      .filter((line) => !line.includes('[DONE]'))
      .map((line) => JSON.parse(line.replace('data: ', '')));

    // Verify mocked response is returned
    const mockedContent = followUpChunks
      .map((chunk) => chunk.choices[0]?.delta?.content || '')
      .join('');

    expect(mockedContent).toBe('The weather is 72°F and sunny');

    // Verify finish_reason is 'stop' for the final response
    const followUpLastChunk = followUpChunks[followUpChunks.length - 1];
    expect(followUpLastChunk.choices[0].finish_reason).toBe('stop');
  });

  // Validate verb coverage
  it('should test all verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'OpenAI E2E Tests');
  });
});
