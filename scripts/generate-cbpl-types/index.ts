#!/usr/bin/env tsx
/**
 * CBPL Type Generator
 *
 * Generates TypeScript types and JSON schema from cbpl.definitions.json
 * Run with: pnpm codegen
 */

import { writeFileSync } from 'fs';
import { join } from 'path';
import { loadAndValidateDefinitions } from './load-definitions.js';
import { generateTypes } from './generate-types.js';
import { generateMarkdown } from './generate-markdown.js';

// Load and validate definitions
const definitions = loadAndValidateDefinitions();

// Write generated types
const typesOutputPath = join(__dirname, '../../src/parser/definitions/cbpl.generated.ts');
const generatedCode = generateTypes(definitions);
writeFileSync(typesOutputPath, generatedCode, 'utf-8');

// Write generated markdown documentation
const docsOutputPath = join(__dirname, '../../CBPL.md');
const generatedMarkdown = generateMarkdown(definitions);
writeFileSync(docsOutputPath, generatedMarkdown, 'utf-8');

console.log('✅ Generated CBPL types successfully!');
console.log(`📄 Types:  ${typesOutputPath}`);
console.log(`📄 Docs:   ${docsOutputPath}`);
console.log(`📊 Commands: ${Object.keys(definitions.commands).join(', ')}`);
