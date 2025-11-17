import { describe, it, expect } from 'vitest';
import { Lexer } from './lexer';
import { TokenType } from './token.types';

describe('Lexer', () => {
  describe('Keywords', () => {
    it('should tokenize SAY keyword', () => {
      const lexer = new Lexer('SAY');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(2); // SAY + EOF
      expect(tokens[0]).toMatchObject({
        type: TokenType.SAY,
        value: 'SAY',
        line: 1,
        column: 1,
      });
      expect(tokens[1].type).toBe(TokenType.EOF);
    });

    it('should tokenize TOOLCALL keyword', () => {
      const lexer = new Lexer('TOOLCALL');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.TOOLCALL,
        value: 'TOOLCALL',
      });
    });

    it('should tokenize CHUNKSIZE keyword', () => {
      const lexer = new Lexer('CHUNKSIZE');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.CHUNKSIZE,
        value: 'CHUNKSIZE',
      });
    });

    it('should tokenize CHUNKLATENCY keyword', () => {
      const lexer = new Lexer('CHUNKLATENCY');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.CHUNKLATENCY,
        value: 'CHUNKLATENCY',
      });
    });

    it('should tokenize keywords case-insensitively', () => {
      const lexer = new Lexer('say Say sAy SAY');
      const tokens = lexer.tokenize();

      // All should be recognized as SAY keyword
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1].type).toBe(TokenType.SAY);
      expect(tokens[2].type).toBe(TokenType.SAY);
      expect(tokens[3].type).toBe(TokenType.SAY);
    });

    it('should tokenize TOOLCALL case-insensitively', () => {
      const lexer = new Lexer('toolcall Toolcall TOOLCALL');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.TOOLCALL);
      expect(tokens[1].type).toBe(TokenType.TOOLCALL);
      expect(tokens[2].type).toBe(TokenType.TOOLCALL);
    });

    it('should tokenize CHUNKSIZE case-insensitively', () => {
      const lexer = new Lexer('chunksize ChunkSize CHUNKSIZE');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CHUNKSIZE);
      expect(tokens[1].type).toBe(TokenType.CHUNKSIZE);
      expect(tokens[2].type).toBe(TokenType.CHUNKSIZE);
    });

    it('should tokenize CHUNKLATENCY case-insensitively', () => {
      const lexer = new Lexer('chunklatency ChunkLatency CHUNKLATENCY');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.CHUNKLATENCY);
      expect(tokens[1].type).toBe(TokenType.CHUNKLATENCY);
      expect(tokens[2].type).toBe(TokenType.CHUNKLATENCY);
    });

    it('should handle mixed case keywords in a program', () => {
      const input = 'say "hello" chunksize 10 toolcall "test"';
      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[2].type).toBe(TokenType.CHUNKSIZE);
      expect(tokens[4].type).toBe(TokenType.TOOLCALL);
    });
  });

  describe('String Literals', () => {
    it('should tokenize simple string', () => {
      const lexer = new Lexer('"Hello, World!"');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: 'Hello, World!',
        line: 1,
        column: 1,
      });
    });

    it('should tokenize empty string', () => {
      const lexer = new Lexer('""');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: '',
      });
    });

    it('should tokenize string with spaces', () => {
      const lexer = new Lexer('"  spaces  everywhere  "');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('  spaces  everywhere  ');
    });

    it('should handle escaped quotes', () => {
      const lexer = new Lexer('"She said \\"Hello\\""');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('She said "Hello"');
    });

    it('should handle escaped newlines', () => {
      const lexer = new Lexer('"Line 1\\nLine 2"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('Line 1\nLine 2');
    });

    it('should handle escaped tabs', () => {
      const lexer = new Lexer('"Tab\\there"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('Tab\there');
    });

    it('should handle escaped backslashes', () => {
      const lexer = new Lexer('"Path: C:\\\\Users\\\\file"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('Path: C:\\Users\\file');
    });

    it('should handle multiple escape sequences', () => {
      const lexer = new Lexer('"Quote: \\"\\nTab:\\tBackslash: \\\\"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('Quote: "\nTab:\tBackslash: \\');
    });

    it('should handle strings with special characters', () => {
      const lexer = new Lexer('"!@#$%^&*()_+-=[]{}|;:,.<>?/"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?/');
    });
  });

  describe('Number Literals', () => {
    it('should tokenize single digit', () => {
      const lexer = new Lexer('5');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.NUMBER,
        value: 5,
        line: 1,
        column: 1,
      });
    });

    it('should tokenize multi-digit number', () => {
      const lexer = new Lexer('12345');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.NUMBER,
        value: 12345,
      });
    });

    it('should tokenize zero', () => {
      const lexer = new Lexer('0');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe(0);
    });

    it('should tokenize large numbers', () => {
      const lexer = new Lexer('999999999');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe(999999999);
    });
  });

  describe('Whitespace Handling', () => {
    it('should skip spaces', () => {
      const lexer = new Lexer('SAY     "hello"');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // SAY, STRING, EOF (no space tokens)
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1].type).toBe(TokenType.STRING);
    });

    it('should skip tabs', () => {
      const lexer = new Lexer('SAY\t\t"hello"');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // No tab tokens
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1].type).toBe(TokenType.STRING);
    });

    it('should preserve newlines as tokens', () => {
      const lexer = new Lexer('SAY\n"hello"');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(4); // SAY, NEWLINE, STRING, EOF
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1].type).toBe(TokenType.NEWLINE);
      expect(tokens[2].type).toBe(TokenType.STRING);
    });

    it('should handle multiple newlines', () => {
      const lexer = new Lexer('SAY\n\n\n"hello"');
      const tokens = lexer.tokenize();

      const newlineTokens = tokens.filter((t) => t.type === TokenType.NEWLINE);
      expect(newlineTokens).toHaveLength(3);
    });

    it('should handle mixed whitespace', () => {
      const lexer = new Lexer('SAY  \t  "hello"  \t\n  CHUNKSIZE   5');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.SAY,
        TokenType.STRING,
        TokenType.NEWLINE,
        TokenType.CHUNKSIZE,
        TokenType.NUMBER,
        TokenType.EOF,
      ]);
    });
  });

  describe('Line and Column Tracking', () => {
    it('should track line numbers', () => {
      const lexer = new Lexer('SAY\n"hello"\nCHUNKSIZE');
      const tokens = lexer.tokenize();

      expect(tokens[0].line).toBe(1); // SAY
      expect(tokens[1].line).toBe(1); // NEWLINE
      expect(tokens[2].line).toBe(2); // "hello"
      expect(tokens[3].line).toBe(2); // NEWLINE
      expect(tokens[4].line).toBe(3); // CHUNKSIZE
    });

    it('should track column numbers', () => {
      const lexer = new Lexer('SAY "hello" 123');
      const tokens = lexer.tokenize();

      expect(tokens[0].column).toBe(1); // SAY starts at column 1
      expect(tokens[1].column).toBe(5); // "hello" starts at column 5
      expect(tokens[2].column).toBe(13); // 123 starts at column 13
    });

    it('should reset column on newline', () => {
      const lexer = new Lexer('SAY\n  CHUNKSIZE');
      const tokens = lexer.tokenize();

      expect(tokens[0].column).toBe(1); // SAY at column 1
      expect(tokens[2].column).toBe(3); // CHUNKSIZE at column 3 (after 2 spaces)
    });
  });

  describe('Complete Statements', () => {
    it('should tokenize SAY statement', () => {
      const lexer = new Lexer('SAY "Hello, World!"');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([TokenType.SAY, TokenType.STRING, TokenType.EOF]);
      expect(tokens[1].value).toBe('Hello, World!');
    });

    it('should tokenize TOOLCALL statement with JSON arguments', () => {
      const lexer = new Lexer('TOOLCALL "get_weather" {"location": "San Francisco"}');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.TOOLCALL,
        TokenType.STRING,
        TokenType.JSON_OBJECT,
        TokenType.EOF,
      ]);
      expect(tokens[1].value).toBe('get_weather');
      expect(tokens[2].value).toBe('{"location": "San Francisco"}');
    });

    it('should tokenize CHUNKSIZE statement', () => {
      const lexer = new Lexer('CHUNKSIZE 10');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.CHUNKSIZE,
        TokenType.NUMBER,
        TokenType.EOF,
      ]);
      expect(tokens[1].value).toBe(10);
    });

    it('should tokenize CHUNKLATENCY statement', () => {
      const lexer = new Lexer('CHUNKLATENCY 50');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.CHUNKLATENCY,
        TokenType.NUMBER,
        TokenType.EOF,
      ]);
      expect(tokens[1].value).toBe(50);
    });

    it('should tokenize multi-line program', () => {
      const input = `SAY "First"
CHUNKSIZE 5
SAY "Second"`;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.SAY,
        TokenType.STRING,
        TokenType.NEWLINE,
        TokenType.CHUNKSIZE,
        TokenType.NUMBER,
        TokenType.NEWLINE,
        TokenType.SAY,
        TokenType.STRING,
        TokenType.EOF,
      ]);
    });

    it('should tokenize multiple commands in one line', () => {
      const lexer = new Lexer('SAY "Hello" CHUNKSIZE 10 SAY "World"');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.SAY,
        TokenType.STRING,
        TokenType.CHUNKSIZE,
        TokenType.NUMBER,
        TokenType.SAY,
        TokenType.STRING,
        TokenType.EOF,
      ]);
    });
  });

  describe('Fancy/Curly Quotes', () => {
    it('should handle fancy double quotes (left and right)', () => {
      const lexer = new Lexer('SAY "Hello World"');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(3); // SAY, STRING, EOF
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens[1]).toMatchObject({
        type: TokenType.STRING,
        value: 'Hello World',
      });
    });

    it('should handle fancy double quotes with left curly opening', () => {
      const lexer = new Lexer('SAY "Hello"');
      const tokens = lexer.tokenize();

      expect(tokens[1]).toMatchObject({
        type: TokenType.STRING,
        value: 'Hello',
      });
    });

    it('should handle fancy single quotes (left and right)', () => {
      const lexer = new Lexer("SAY 'Hello World'");
      const tokens = lexer.tokenize();

      expect(tokens[1]).toMatchObject({
        type: TokenType.STRING,
        value: 'Hello World',
      });
    });

    it('should handle mixed quote styles in same input', () => {
      const lexer = new Lexer('SAY "fancy" "straight" \'single\'');
      const tokens = lexer.tokenize();

      expect(tokens[1].value).toBe('fancy');
      expect(tokens[2].value).toBe('straight');
      expect(tokens[3].value).toBe('single');
    });

    it('should handle fancy quotes with escape sequences', () => {
      const lexer = new Lexer('"Line 1\\nLine 2"');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: 'Line 1\nLine 2',
      });
    });

    it('should handle fancy quotes in complex statement', () => {
      const lexer = new Lexer('TOOLCALL "get_weather" "San Francisco"');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.TOOLCALL,
        TokenType.STRING,
        TokenType.STRING,
        TokenType.EOF,
      ]);
      expect(tokens[1].value).toBe('get_weather');
      expect(tokens[2].value).toBe('San Francisco');
    });

    it('should handle fancy quotes with special characters', () => {
      const lexer = new Lexer('"!@#$%^&*()_+-=[]{}|;:,.<>?/"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('!@#$%^&*()_+-=[]{}|;:,.<>?/');
    });

    it('should handle empty string with fancy quotes', () => {
      const lexer = new Lexer('""');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.STRING,
        value: '',
      });
    });

    it('should handle unterminated fancy quote gracefully', () => {
      const lexer = new Lexer('"unterminated');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('unterminated');
    });

    it('should handle fancy quotes in multi-line program', () => {
      const input = `SAY "First line"
CHUNKSIZE 5
SAY "Second line"`;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      expect(tokens[1].value).toBe('First line');
      expect(tokens[7].value).toBe('Second line');
    });
  });

  describe('JSON Objects', () => {
    it('should tokenize simple JSON object', () => {
      const lexer = new Lexer('{"key": "value"}');
      const tokens = lexer.tokenize();

      expect(tokens[0]).toMatchObject({
        type: TokenType.JSON_OBJECT,
        value: '{"key": "value"}',
      });
    });

    it('should tokenize JSON object with numbers', () => {
      const lexer = new Lexer('{"age": 30, "count": 100}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      expect(tokens[0].value).toBe('{"age": 30, "count": 100}');
    });

    it('should tokenize nested JSON objects', () => {
      const lexer = new Lexer('{"user": {"name": "John", "age": 30}}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      expect(tokens[0].value).toBe('{"user": {"name": "John", "age": 30}}');
    });

    it('should tokenize JSON with arrays', () => {
      const lexer = new Lexer('{"items": [1, 2, 3], "tags": ["a", "b"]}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      const parsed = JSON.parse(tokens[0].value as string);
      expect(parsed.items).toEqual([1, 2, 3]);
      expect(parsed.tags).toEqual(['a', 'b']);
    });

    it('should handle JSON with fancy quotes', () => {
      const lexer = new Lexer('{"key": "value"}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
    });

    it('should handle JSON in TOOLCALL statement', () => {
      const lexer = new Lexer('TOOLCALL "get_weather" {"location": "SF", "unit": "celsius"}');
      const tokens = lexer.tokenize();

      expect(tokens.map((t) => t.type)).toEqual([
        TokenType.TOOLCALL,
        TokenType.STRING,
        TokenType.JSON_OBJECT,
        TokenType.EOF,
      ]);
      expect(tokens[1].value).toBe('get_weather');
      expect(tokens[2].value).toBe('{"location": "SF", "unit": "celsius"}');
    });

    it('should tokenize empty JSON object', () => {
      const lexer = new Lexer('{}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      expect(tokens[0].value).toBe('{}');
    });

    it('should handle JSON with escaped quotes', () => {
      const lexer = new Lexer('{"message": "He said \\"hello\\""}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      const parsed = JSON.parse(tokens[0].value as string);
      expect(parsed.message).toBe('He said "hello"');
    });

    it('should mark invalid JSON as INVALID token', () => {
      const lexer = new Lexer('{invalid json}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.INVALID);
    });

    it('should handle JSON with booleans and null', () => {
      const lexer = new Lexer('{"active": true, "deleted": false, "data": null}');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      const parsed = JSON.parse(tokens[0].value as string);
      expect(parsed.active).toBe(true);
      expect(parsed.deleted).toBe(false);
      expect(parsed.data).toBe(null);
    });

    it('should handle JSON with mixed whitespace', () => {
      const lexer = new Lexer(`{
        "key": "value",
        "nested": {
          "foo": "bar"
        }
      }`);
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.JSON_OBJECT);
      // Verify it's valid JSON
      expect(() => JSON.parse(tokens[0].value as string)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', () => {
      const lexer = new Lexer('');
      const tokens = lexer.tokenize();

      expect(tokens).toHaveLength(1); // Just EOF
      expect(tokens[0].type).toBe(TokenType.EOF);
    });

    it('should handle whitespace-only input', () => {
      const lexer = new Lexer('   \t  \n  ');
      const tokens = lexer.tokenize();

      expect(tokens.some((t) => t.type === TokenType.NEWLINE)).toBe(true);
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    it('should handle unterminated string gracefully', () => {
      const lexer = new Lexer('SAY "unterminated');
      const tokens = lexer.tokenize();

      // Should still produce a string token (with whatever content it found)
      expect(tokens[1].type).toBe(TokenType.STRING);
      expect(tokens[1].value).toBe('unterminated');
    });

    it('should handle invalid characters as INVALID tokens', () => {
      const lexer = new Lexer('SAY @ "hello"');
      const tokens = lexer.tokenize();

      expect(tokens[1].type).toBe(TokenType.INVALID);
      expect(tokens[1].value).toBe('@');
    });

    it('should tokenize multiple invalid keywords', () => {
      const lexer = new Lexer('INVALID_KEYWORD');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.INVALID);
    });
  });

  describe('Complex Inputs', () => {
    it('should tokenize complex multi-statement program', () => {
      const input = `SAY "Starting process..."
CHUNKSIZE 10
CHUNKLATENCY 50
SAY "Processing with custom settings"
TOOLCALL "fetch_data" "users"
SAY "Complete!"`;

      const lexer = new Lexer(input);
      const tokens = lexer.tokenize();

      // Verify structure without checking exact token count
      expect(tokens[0].type).toBe(TokenType.SAY);
      expect(tokens.find((t) => t.type === TokenType.CHUNKSIZE)).toBeDefined();
      expect(tokens.find((t) => t.type === TokenType.CHUNKLATENCY)).toBeDefined();
      expect(tokens.find((t) => t.type === TokenType.TOOLCALL)).toBeDefined();
      expect(tokens[tokens.length - 1].type).toBe(TokenType.EOF);
    });

    it('should handle strings with many escape sequences', () => {
      const lexer = new Lexer('"Test:\\n\\tEscaped \\"quotes\\"\\nNew line\\\\backslash"');
      const tokens = lexer.tokenize();

      expect(tokens[0].type).toBe(TokenType.STRING);
      expect(tokens[0].value).toBe('Test:\n\tEscaped "quotes"\nNew line\\backslash');
    });

    it('should tokenize back-to-back strings', () => {
      const lexer = new Lexer('"first""second""third"');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe('first');
      expect(tokens[1].value).toBe('second');
      expect(tokens[2].value).toBe('third');
    });

    it('should tokenize multiple numbers', () => {
      const lexer = new Lexer('1 22 333 4444');
      const tokens = lexer.tokenize();

      expect(tokens[0].value).toBe(1);
      expect(tokens[1].value).toBe(22);
      expect(tokens[2].value).toBe(333);
      expect(tokens[3].value).toBe(4444);
    });
  });
});
