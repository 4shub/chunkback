import { TestCase } from './types';

export const testCases: TestCase[] = [
  {
    name: 'SAY command',
    prompt: 'SAY "Hello World"',
    verbs: ['SAY'],
    expectedContent: 'Hello World',
  },
  {
    name: 'CHUNKSIZE command',
    prompt: 'CHUNKSIZE 5\nSAY "Hello World"',
    verbs: ['CHUNKSIZE', 'SAY'],
    expectedContent: 'Hello World',
  },
  {
    name: 'CHUNKLATENCY command',
    prompt: 'CHUNKLATENCY 100\nSAY "Hello World"',
    verbs: ['CHUNKLATENCY', 'SAY'],
    expectedContent: 'Hello World',
  },
  {
    name: 'RANDOMLATENCY command',
    prompt: 'RANDOMLATENCY 5 10\nSAY "Hello World"',
    verbs: ['RANDOMLATENCY', 'SAY'],
    expectedContent: 'Hello World',
  },
  {
    name: 'TOOLCALL command',
    prompt: 'TOOLCALL "get_weather" {"location": "San Francisco"}',
    verbs: ['TOOLCALL'],
    expectedToolName: 'get_weather',
  },
  {
    name: 'Combo: Multiple SAYs with different chunk settings',
    prompt:
      'SAY "First"\nCHUNKSIZE 3\nCHUNKLATENCY 50\nSAY "Second"\nCHUNKLATENCY 100\nSAY "Third"\nTOOLCALL "test" {"args": "value"}',
    verbs: ['SAY', 'CHUNKSIZE', 'CHUNKLATENCY', 'TOOLCALL'],
    expectedContent: 'FirstSecondThird',
    expectedToolName: 'test',
  },
];
