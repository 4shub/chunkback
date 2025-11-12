/**
 * CBPL (Chunkback Prompt Language) Token Types
 *
 * Defines all token types that can appear in CBPL code.
 * Keywords are auto-generated from cbpl.definitions.json
 */

import { COMMAND_NAMES } from '../definitions/cbpl.generated';

export enum TokenType {
  // Keywords - generated from CBPL definitions
  SAY = 'SAY',
  TOOLCALL = 'TOOLCALL',
  CHUNKSIZE = 'CHUNKSIZE',
  CHUNKLATENCY = 'CHUNKLATENCY',
  RANDOMLATENCY = 'RANDOMLATENCY',
  LIPSUM = 'LIPSUM',

  // Literals
  STRING = 'STRING',
  NUMBER = 'NUMBER',

  // Special
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
  INVALID = 'INVALID',
}

export interface Token {
  type: TokenType;
  value: string | number;
  line: number;
  column: number;
}

/**
 * Keywords map for quick lookup - generated from CBPL definitions
 */
export const KEYWORDS: Record<string, TokenType> = COMMAND_NAMES.reduce(
  (acc, name) => {
    acc[name] = TokenType[name];
    return acc;
  },
  {} as Record<string, TokenType>
);
