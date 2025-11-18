/**
 * CBPL (Chunkback Prompt Language) Lexer
 *
 * Tokenizes CBPL input strings into a stream of tokens.
 * Similar to SQL lexers, it reads character by character and produces tokens.
 */

import { Token, TokenType, KEYWORDS } from './token.types';

export class Lexer {
  private input: string;
  private position: number = 0;
  private line: number = 1;
  private column: number = 1;
  private currentChar: string | null;

  constructor(input: string) {
    this.input = input;
    this.currentChar = input.length > 0 ? input[0] : null;
  }

  /**
   * Main method: tokenize the entire input
   */
  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.currentChar !== null) {
      // Skip whitespace (except newlines)
      if (this.isWhitespace(this.currentChar) && this.currentChar !== '\n') {
        this.skipWhitespace();
        continue;
      }

      // Handle newlines
      if (this.currentChar === '\n') {
        tokens.push(this.makeToken(TokenType.NEWLINE, '\n'));
        this.advance();
        continue;
      }

      // Handle string literals (double quotes - straight and fancy/curly)
      if (this.isQuote(this.currentChar)) {
        tokens.push(this.readString());
        continue;
      }

      // Handle JSON objects
      if (this.currentChar === '{') {
        tokens.push(this.readJsonObject());
        continue;
      }

      // Handle numbers
      if (this.isDigit(this.currentChar)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Handle keywords and identifiers
      if (this.isAlpha(this.currentChar)) {
        tokens.push(this.readKeyword());
        continue;
      }

      // Invalid character
      tokens.push(this.makeToken(TokenType.INVALID, this.currentChar));
      this.advance();
    }

    // Add EOF token
    tokens.push(this.makeToken(TokenType.EOF, ''));

    return tokens;
  }

  /**
   * Advance to the next character
   */
  private advance(): void {
    if (this.currentChar === '\n') {
      this.line++;
      this.column = 1;
    } else {
      this.column++;
    }

    this.position++;
    this.currentChar = this.position < this.input.length ? this.input[this.position] : null;
  }

  /**
   * Peek at the next character without advancing
   */
  private peek(offset: number = 1): string | null {
    const pos = this.position + offset;
    return pos < this.input.length ? this.input[pos] : null;
  }

  /**
   * Skip whitespace characters (except newlines)
   */
  private skipWhitespace(): void {
    while (
      this.currentChar !== null &&
      this.isWhitespace(this.currentChar) &&
      this.currentChar !== '\n'
    ) {
      this.advance();
    }
  }

  /**
   * Read a string literal (enclosed in double quotes - straight or fancy/curly)
   */
  private readString(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    // Store the opening quote to match with closing quote
    const openingQuote = this.currentChar;

    // Skip opening quote
    this.advance();

    // Continue until we find a matching closing quote or end of input
    while (
      this.currentChar !== null &&
      !this.isMatchingClosingQuote(openingQuote, this.currentChar)
    ) {
      // Handle escape sequences
      if (this.currentChar === '\\' && this.peek() && this.isQuote(this.peek()!)) {
        this.advance(); // Skip backslash
        value += this.currentChar!;
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === 'n') {
        this.advance(); // Skip backslash
        value += '\n';
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === 't') {
        this.advance(); // Skip backslash
        value += '\t';
        this.advance();
      } else if (this.currentChar === '\\' && this.peek() === '\\') {
        this.advance(); // Skip backslash
        value += '\\';
        this.advance();
      } else {
        value += this.currentChar;
        this.advance();
      }
    }

    // Skip closing quote
    if (this.currentChar !== null && this.isMatchingClosingQuote(openingQuote, this.currentChar)) {
      this.advance();
    }

    return {
      type: TokenType.STRING,
      value,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Read a JSON object literal (enclosed in curly braces)
   */
  private readJsonObject(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';
    let braceCount = 0;

    // Include opening brace
    value += this.currentChar;
    braceCount++;
    this.advance();

    // Continue until we find the matching closing brace
    while (this.currentChar !== null && braceCount > 0) {
      // Track nested braces
      if (this.currentChar === '{') {
        braceCount++;
      } else if (this.currentChar === '}') {
        braceCount--;
      }

      // Handle strings within JSON to avoid counting braces inside strings
      if (this.isQuote(this.currentChar)) {
        const quote = this.currentChar;
        value += this.currentChar;
        this.advance();

        // Read until closing quote
        while (this.currentChar !== null && !this.isMatchingClosingQuote(quote, this.currentChar)) {
          // Handle escape sequences
          if (this.currentChar === '\\' && this.peek()) {
            value += this.currentChar; // backslash
            this.advance();
            value += this.currentChar!; // escaped character
            this.advance();
          } else {
            value += this.currentChar;
            this.advance();
          }
        }

        // Include closing quote
        if (this.currentChar !== null) {
          value += this.currentChar;
          this.advance();
        }
        continue;
      }

      value += this.currentChar;
      this.advance();
    }

    // Validate JSON syntax
    try {
      JSON.parse(value);
    } catch {
      // Invalid JSON - return as INVALID token
      return {
        type: TokenType.INVALID,
        value: value,
        line: startLine,
        column: startColumn,
      };
    }

    return {
      type: TokenType.JSON_OBJECT,
      value: value,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Read a number literal
   */
  private readNumber(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.currentChar !== null && this.isDigit(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    return {
      type: TokenType.NUMBER,
      value: parseInt(value, 10),
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Read a keyword or identifier
   */
  private readKeyword(): Token {
    const startLine = this.line;
    const startColumn = this.column;
    let value = '';

    while (this.currentChar !== null && this.isAlphaNumeric(this.currentChar)) {
      value += this.currentChar;
      this.advance();
    }

    // Check if it's a keyword
    const keyword = value.toUpperCase();
    const tokenType = KEYWORDS[keyword] || TokenType.INVALID;

    return {
      type: tokenType,
      value: keyword,
      line: startLine,
      column: startColumn,
    };
  }

  /**
   * Create a token
   */
  private makeToken(type: TokenType, value: string | number): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.column,
    };
  }

  /**
   * Helper: check if character is whitespace
   */
  private isWhitespace(char: string): boolean {
    return char === ' ' || char === '\t' || char === '\r' || char === '\n';
  }

  /**
   * Helper: check if character is a digit
   */
  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  /**
   * Helper: check if character is alphabetic
   */
  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z');
  }

  /**
   * Helper: check if character is alphanumeric
   */
  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  /**
   * Helper: check if character is a quote (straight or fancy/curly)
   */
  private isQuote(char: string): boolean {
    return (
      char === '"' || // Straight double quote
      char === '\u201C' || // Left double quotation mark " (fancy/curly opening)
      char === '\u201D' || // Right double quotation mark " (fancy/curly closing)
      char === "'" || // Straight single quote
      char === '\u2018' || // Left single quotation mark ' (fancy/curly opening)
      char === '\u2019' // Right single quotation mark ' (fancy/curly closing)
    );
  }

  /**
   * Helper: check if the current character is a valid closing quote for the opening quote
   */
  private isMatchingClosingQuote(openingQuote: string | null, currentChar: string): boolean {
    if (!openingQuote) return false;

    // Map opening quotes to their valid closing quotes
    const quoteMap: { [key: string]: string[] } = {
      '"': ['"'], // Straight quote closes with straight quote
      '\u201C': ['\u201D', '"'], // Fancy opening " can close with fancy closing " or straight "
      "'": ["'"], // Straight single quote closes with straight single quote
      '\u2018': ['\u2019', "'"], // Fancy opening ' can close with fancy closing ' or straight '
    };

    const validClosingQuotes = quoteMap[openingQuote] || [openingQuote];
    return validClosingQuotes.includes(currentChar);
  }
}
