/**
 * Simulator exports for frontend use
 *
 * This module exports functions that can be used in a frontend simulator
 * to parse CBPL prompts and generate streaming responses.
 */

import { parsePrompt } from '../parser/parse-prompt/parse-prompt';
import { ParsedPrompt, ExecutableCommand } from '../parser/types/command.types';
import { StreamChunk } from '../streaming/openai/types/streaming.types';

// Re-export parsePrompt
export { parsePrompt };

// Re-export types
export type { ParsedPrompt, ExecutableCommand, StreamChunk };

/**
 * Utility to chunk a string into smaller pieces
 */
function chunkString(text: string, size: number): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    chunks.push(text.slice(i, i + size));
  }
  return chunks;
}

/**
 * Generate lorem ipsum text with specified number of words
 */
function generateLoremIpsum(wordCount: number): string {
  const words = [
    'lorem',
    'ipsum',
    'dolor',
    'sit',
    'amet',
    'consectetur',
    'adipiscing',
    'elit',
    'sed',
    'do',
    'eiusmod',
    'tempor',
    'incididunt',
    'ut',
    'labore',
    'et',
    'dolore',
    'magna',
    'aliqua',
    'enim',
    'ad',
    'minim',
    'veniam',
    'quis',
    'nostrud',
    'exercitation',
    'ullamco',
    'laboris',
    'nisi',
    'aliquip',
    'ex',
    'ea',
    'commodo',
    'consequat',
    'duis',
    'aute',
    'irure',
    'in',
    'reprehenderit',
    'voluptate',
    'velit',
    'esse',
    'cillum',
    'fugiat',
    'nulla',
    'pariatur',
    'excepteur',
    'sint',
    'occaecat',
    'cupidatat',
    'non',
    'proident',
    'sunt',
    'culpa',
    'qui',
    'officia',
    'deserunt',
    'mollit',
    'anim',
    'id',
    'est',
    'laborum',
  ];

  const result: string[] = [];
  for (let i = 0; i < wordCount; i++) {
    result.push(words[i % words.length]);
  }

  // Capitalize first word
  if (result.length > 0) {
    result[0] = result[0].charAt(0).toUpperCase() + result[0].slice(1);
  }

  return result.join(' ') + '.';
}

/**
 * Create a streaming chunk in OpenAI format
 */
function createChunk(
  content: string | null,
  isFirst: boolean,
  isLast: boolean,
  toolCall?: {
    index: number;
    id: string;
    type: string;
    function: {
      name: string;
      arguments: string;
    };
  }
): StreamChunk {
  const chunk: StreamChunk = {
    id: `chatcmpl-${Math.random().toString(36).substring(2, 15)}`,
    object: 'chat.completion.chunk',
    created: Math.floor(Date.now() / 1000),
    model: 'chunkback-simulator',
    choices: [
      {
        index: 0,
        delta: {
          ...(isFirst && { role: 'assistant' }),
          ...(content !== null && { content }),
          ...(toolCall && { tool_calls: [toolCall] }),
        },
        finish_reason: isLast ? 'stop' : null,
      },
    ],
  };
  return chunk;
}

/**
 * Generate streaming response chunks from a parsed prompt
 * This is an async generator that yields StreamChunk objects
 *
 * @param parsed - The parsed prompt from parsePrompt()
 * @returns AsyncGenerator that yields StreamChunk objects
 *
 * @example
 * const parsed = parsePrompt("SAY[Hello world]");
 * for await (const chunk of streamParsedPrompt(parsed)) {
 *   console.log(chunk);
 * }
 */
export async function* streamParsedPrompt(
  parsed: ParsedPrompt
): AsyncGenerator<StreamChunk, void, unknown> {
  if (!parsed.commands || parsed.commands.length === 0) {
    throw new Error('No commands found in parsed prompt');
  }

  let isFirstChunk = true;

  for (const executableCommand of parsed.commands) {
    const { command, chunkSize = 5, chunkLatency = 0, randomLatency } = executableCommand;

    if (command.type === 'SAY') {
      const content = command.content;
      const chunks = chunkString(content, chunkSize);

      for (let i = 0; i < chunks.length; i++) {
        const isLastChunk =
          i === chunks.length - 1 &&
          parsed.commands.indexOf(executableCommand) === parsed.commands.length - 1;

        // Calculate delay (apply after first chunk)
        if (i > 0 || !isFirstChunk) {
          let delay = chunkLatency;
          if (randomLatency) {
            const [min, max] = randomLatency;
            delay = Math.floor(Math.random() * (max - min + 1)) + min;
          }

          // Wait for the specified delay
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        yield createChunk(chunks[i], isFirstChunk, isLastChunk);
        isFirstChunk = false;
      }
    } else if (command.type === 'LIPSUM') {
      const content = generateLoremIpsum(command.wordCount);
      const chunks = chunkString(content, chunkSize);

      for (let i = 0; i < chunks.length; i++) {
        const isLastChunk =
          i === chunks.length - 1 &&
          parsed.commands.indexOf(executableCommand) === parsed.commands.length - 1;

        // Calculate delay (apply after first chunk)
        if (i > 0 || !isFirstChunk) {
          let delay = chunkLatency;
          if (randomLatency) {
            const [min, max] = randomLatency;
            delay = Math.floor(Math.random() * (max - min + 1)) + min;
          }

          // Wait for the specified delay
          if (delay > 0) {
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }

        yield createChunk(chunks[i], isFirstChunk, isLastChunk);
        isFirstChunk = false;
      }
    } else if (command.type === 'TOOLCALL') {
      const isLastChunk = parsed.commands.indexOf(executableCommand) === parsed.commands.length - 1;

      yield createChunk(null, isFirstChunk, isLastChunk, {
        index: 0,
        id: `call_${Math.random().toString(36).substring(2, 15)}`,
        type: 'function',
        function: {
          name: command.toolName,
          arguments: command.arguments,
        },
      });
      isFirstChunk = false;
    }
  }
}

/**
 * Convenience function that combines parsePrompt and streamParsedPrompt
 *
 * @param prompt - Raw CBPL prompt string
 * @returns AsyncGenerator that yields StreamChunk objects
 *
 * @example
 * for await (const chunk of streamPrompt("SAY[Hello world]")) {
 *   console.log(chunk);
 * }
 */
export async function* streamPrompt(prompt: string): AsyncGenerator<StreamChunk, void, unknown> {
  const parsed = parsePrompt(prompt);
  yield* streamParsedPrompt(parsed);
}
