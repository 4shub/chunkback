/**
 * CBPL (Chunkback Prompt Language) Parser
 *
 * Parses a stream of tokens from the lexer into an Abstract Syntax Tree (AST).
 * Uses recursive descent parsing similar to SQL parsers.
 */

import { Token, TokenType } from '../lexer/token.types';
import { Lexer } from '../lexer/lexer';
import { Command, ExecutableCommand, ParsedPrompt } from '../types/command.types';

export class CBPLParser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  /**
   * Parse tokens into a ParsedPrompt AST
   */
  public parse(): ParsedPrompt {
    const commands: ExecutableCommand[] = [];
    let currentChunkSize: number | undefined;
    let currentChunkLatency: number | undefined;
    let randomLatency: [number, number] | undefined;

    while (!this.isAtEnd()) {
      // Skip newlines
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
        continue;
      }

      // Skip EOF
      if (this.check(TokenType.EOF)) {
        break;
      }

      // Parse statement
      const statement = this.parseStatement();

      if (statement) {
        switch (statement.type) {
          case 'SAY':
          case 'TOOLCALL':
            commands.push({
              command: statement,
              chunkSize: currentChunkSize,
              chunkLatency: currentChunkLatency,
              randomLatency: randomLatency,
            });
            break;

          case 'CHUNKSIZE':
            currentChunkSize = statement.size;
            break;

          case 'CHUNKLATENCY':
            currentChunkLatency = statement.latency;
            break;
          case 'RANDOMLATENCY':
            randomLatency = [statement.minLatency, statement.maxLatency];
            break;
        }
      }

      // Consume optional newline after statement
      if (this.check(TokenType.NEWLINE)) {
        this.advance();
      }
    }

    return { commands };
  }

  /**
   * Parse a single statement
   */
  private parseStatement(): Command | null {
    if (this.check(TokenType.SAY)) {
      return this.parseSayStatement();
    }

    if (this.check(TokenType.TOOLCALL)) {
      return this.parseToolCallStatement();
    }

    if (this.check(TokenType.CHUNKSIZE)) {
      return this.parseChunkSizeStatement();
    }

    if (this.check(TokenType.RANDOMLATENCY)) {
      return this.parseRandomLatencyStatement();
    }

    if (this.check(TokenType.CHUNKLATENCY)) {
      return this.parseChunkLatencyStatement();
    }

    // Invalid token, skip it
    this.advance();
    return null;
  }

  /**
   * Parse SAY statement: SAY "content"
   */
  private parseSayStatement(): Command {
    this.consume(TokenType.SAY, 'Expected SAY keyword');
    const content = this.consume(TokenType.STRING, 'Expected string after SAY');

    return {
      type: 'SAY',
      content: content.value as string,
    };
  }

  /**
   * Parse TOOLCALL statement: TOOLCALL "toolName" {arguments} "mockedResponse"
   */
  private parseToolCallStatement(): Command {
    this.consume(TokenType.TOOLCALL, 'Expected TOOLCALL keyword');
    const toolName = this.consume(TokenType.STRING, 'Expected tool name string');
    const args = this.consume(TokenType.JSON_OBJECT, 'Expected JSON object for arguments');
    const mockedResponse = this.consume(TokenType.STRING, 'Expected mocked response string');

    return {
      type: 'TOOLCALL',
      toolName: toolName.value as string,
      arguments: args.value as string,
      mockedResponse: mockedResponse.value as string,
    };
  }

  /**
   * Parse CHUNKSIZE statement: CHUNKSIZE number
   */
  private parseChunkSizeStatement(): Command {
    this.consume(TokenType.CHUNKSIZE, 'Expected CHUNKSIZE keyword');
    const size = this.consume(TokenType.NUMBER, 'Expected number after CHUNKSIZE');

    return {
      type: 'CHUNKSIZE',
      size: size.value as number,
    };
  }

  /**
   * Parse CHUNKLATENCY statement: CHUNKLATENCY number
   */
  private parseChunkLatencyStatement(): Command {
    this.consume(TokenType.CHUNKLATENCY, 'Expected CHUNKLATENCY keyword');
    const latency = this.consume(TokenType.NUMBER, 'Expected number after CHUNKLATENCY');

    return {
      type: 'CHUNKLATENCY',
      latency: latency.value as number,
    };
  }

  /**
   * Parse RANDOMLATENCY statement: RANDOMLATENCY number number
   */
  private parseRandomLatencyStatement(): Command {
    this.consume(TokenType.RANDOMLATENCY, 'Expected RANDOMLATENCY keyword');
    const minLatency = this.consume(TokenType.NUMBER, 'Expected minimum latency number');
    const maxLatency = this.consume(TokenType.NUMBER, 'Expected maximum latency number');
    return {
      type: 'RANDOMLATENCY',
      minLatency: minLatency.value as number,
      maxLatency: maxLatency.value as number,
    };
  }

  /**
   * Consume a token of the expected type
   */
  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) {
      return this.advance();
    }

    throw this.error(this.peek(), message);
  }

  /**
   * Check if current token is of given type
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Advance to next token
   */
  private advance(): Token {
    if (!this.isAtEnd()) {
      this.current++;
    }
    return this.previous();
  }

  /**
   * Check if we're at the end of tokens
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Peek at current token
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * Get previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  /**
   * Create a parse error
   */
  private error(token: Token, message: string): Error {
    return new Error(`Parse error at line ${token.line}, column ${token.column}: ${message}`);
  }
}

/**
 * Convenience function to parse CBPL input string
 */
export function parseCBPL(input: string): ParsedPrompt {
  const lexer = new Lexer(input);
  const tokens = lexer.tokenize();
  const parser = new CBPLParser(tokens);
  return parser.parse();
}
