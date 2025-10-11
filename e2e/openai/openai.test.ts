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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'echo-model',
          messages: [
            { role: 'user', content: testCase.prompt }
          ]
        })
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const text = await response.text();
      const lines = text.split('\n').filter(line => line.startsWith('data: '));

      // Should have at least one data line and [DONE]
      expect(lines.length).toBeGreaterThan(0);
      expect(text).toContain('data: [DONE]');

      // Parse chunks
      const chunks = lines
        .filter(line => !line.includes('[DONE]'))
        .map(line => {
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
        const fullContent = chunks
          .map(chunk => chunk.choices[0]?.delta?.content || '')
          .join('');
        expect(fullContent).toBe(testCase.expectedContent);
      }

      if (testCase.expectedToolName) {
        const toolCalls = chunks
          .flatMap(chunk => chunk.choices[0]?.delta?.tool_calls || []);
        expect(toolCalls.length).toBeGreaterThan(0);
        expect(toolCalls[0].function.name).toBe(testCase.expectedToolName);
      }
    });
  });

  // Validate verb coverage
  it('should test all verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'OpenAI E2E Tests');
  });
});
