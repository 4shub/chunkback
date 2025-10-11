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
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'echo-model',
          max_tokens: 1024,
          messages: [
            { role: 'user', content: testCase.prompt }
          ]
        })
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('content-type')).toContain('text/event-stream');

      const text = await response.text();

      // Parse SSE format: event lines followed by data lines
      const lines = text.split('\n');
      const chunks: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('data: ')) {
          const jsonStr = lines[i].replace('data: ', '');
          try {
            chunks.push(JSON.parse(jsonStr));
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }

      expect(chunks.length).toBeGreaterThan(0);

      // Verify structure - should have message_start
      const messageStart = chunks.find(chunk => chunk.type === 'message_start');
      expect(messageStart).toBeDefined();
      expect(messageStart?.message).toHaveProperty('role', 'assistant');

      // Should have content_block_start
      const blockStart = chunks.find(chunk => chunk.type === 'content_block_start');
      expect(blockStart).toBeDefined();

      // Should have message_stop
      const messageStop = chunks.find(chunk => chunk.type === 'message_stop');
      expect(messageStop).toBeDefined();

      // Verify content or tool call
      if (testCase.expectedContent) {
        const contentDeltas = chunks
          .filter(chunk => chunk.type === 'content_block_delta' && chunk.delta?.type === 'text_delta')
          .map(chunk => chunk.delta?.text || '');
        const fullContent = contentDeltas.join('');
        expect(fullContent).toBe(testCase.expectedContent);
      }

      if (testCase.expectedToolName) {
        const toolBlock = chunks.find(
          chunk => chunk.type === 'content_block_start' && chunk.content_block?.type === 'tool_use'
        );
        expect(toolBlock).toBeDefined();
        expect(toolBlock?.content_block?.name).toBe(testCase.expectedToolName);
      }
    });
  });

  // Validate verb coverage
  it('should test all verbs', () => {
    const testedVerbs = collectTestedVerbs(testCases);
    validateVerbCoverage(testedVerbs, 'Anthropic E2E Tests');
  });
});
