import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { startTestServer, stopTestServer } from '../utils/server';
import { testCases } from '../utils/test-cases';
import { validateVerbCoverage, collectTestedVerbs } from '../utils/coverage-validator';

describe('Gemini Endpoint E2E Tests', () => {
  let baseUrl: string;

  beforeAll(async () => {
    baseUrl = await startTestServer(3003);
  });

  afterAll(async () => {
    await stopTestServer();
  });

  // Test each verb individually
  testCases.forEach((testCase) => {
    it(testCase.name, async () => {
      const response = await fetch(`${baseUrl}/v1/models/echo-model/generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: testCase.prompt }],
            },
          ],
        }),
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('application/json');

      const text = await response.text();
      const lines = text.split('\n').filter((line) => line.trim().length > 0);

      // Should have at least one line
      expect(lines.length).toBeGreaterThan(0);

      // Parse chunks
      const chunks = lines.map((line) => JSON.parse(line));

      expect(chunks.length).toBeGreaterThan(0);

      // Verify structure
      for (const chunk of chunks) {
        expect(chunk).toHaveProperty('candidates');
        expect(Array.isArray(chunk.candidates)).toBe(true);
        expect(chunk.candidates[0]).toHaveProperty('content');
        expect(chunk.candidates[0].content).toHaveProperty('parts');
        expect(chunk.candidates[0].content).toHaveProperty('role', 'model');
      }

      // Last chunk should have finishReason
      const lastChunk = chunks[chunks.length - 1];
      expect(lastChunk.candidates[0].finishReason).toBe('STOP');

      // Verify content or tool call
      if (testCase.expectedContent) {
        const textParts = chunks
          .flatMap((chunk) => chunk.candidates[0]?.content?.parts || [])
          .filter((part) => part.text)
          .map((part) => part.text);
        const fullContent = textParts.join('');
        expect(fullContent).toBe(testCase.expectedContent);
      }

      if (testCase.expectedToolName) {
        const toolParts = chunks
          .flatMap((chunk) => chunk.candidates[0]?.content?.parts || [])
          .filter((part) => part.functionCall);
        expect(toolParts.length).toBeGreaterThan(0);
        expect(toolParts[0].functionCall.name).toBe(testCase.expectedToolName);
      }
    });
  });

  // Test complete tool calling flow with follow-up
  it('should handle tool call flow with follow-up request', async () => {
    // Step 1: Send initial request with TOOLCALL
    const initialResponse = await fetch(`${baseUrl}/v1/models/echo-model/generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'TOOLCALL "get_weather" {"location": "San Francisco"} "The weather is 72°F and sunny"',
              },
            ],
          },
        ],
      }),
    });

    expect(initialResponse.ok).toBe(true);
    const initialText = await initialResponse.text();
    const initialLines = initialText.split('\n').filter((line) => line.trim().length > 0);
    const initialChunks = initialLines.map((line) => JSON.parse(line));

    // Extract function call from initial response
    const functionCallParts = initialChunks
      .flatMap((chunk) => chunk.candidates[0]?.content?.parts || [])
      .filter((part) => part.functionCall);

    expect(functionCallParts.length).toBeGreaterThan(0);
    const functionCall = functionCallParts[0].functionCall;
    expect(functionCall.name).toBe('get_weather');
    expect(functionCall.args).toEqual({ location: 'San Francisco' });

    // Step 2: Send follow-up request with function response
    const followUpResponse = await fetch(`${baseUrl}/v1/models/echo-model/generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'TOOLCALL "get_weather" {"location": "San Francisco"} "The weather is 72°F and sunny"',
              },
            ],
          },
          {
            role: 'model',
            parts: [
              {
                functionCall: {
                  name: 'get_weather',
                  args: { location: 'San Francisco' },
                },
              },
            ],
          },
          {
            role: 'user',
            parts: [
              {
                functionResponse: {
                  name: 'get_weather',
                  response: { result: 'Current weather data' },
                },
              },
            ],
          },
        ],
      }),
    });

    expect(followUpResponse.ok).toBe(true);
    const followUpText = await followUpResponse.text();
    const followUpLines = followUpText.split('\n').filter((line) => line.trim().length > 0);
    const followUpChunks = followUpLines.map((line) => JSON.parse(line));

    // Verify mocked response is returned
    const textParts = followUpChunks
      .flatMap((chunk) => chunk.candidates[0]?.content?.parts || [])
      .filter((part) => part.text)
      .map((part) => part.text);

    const mockedContent = textParts.join('');
    expect(mockedContent).toBe('The weather is 72°F and sunny');
  });

  // Validate verb coverage
  it('should test all verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'Gemini E2E Tests');
  });
});
