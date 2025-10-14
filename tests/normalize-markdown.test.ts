/**
 * Regression tests for markdown normalization helper.
 *
 * Run with: npx tsx tests/normalize-markdown.test.ts
 */

import assert from 'node:assert';
import { normalizeMarkdownContent } from '../lib/output/markdown';

const cases: Array<{ name: string; input: string; expected: string }> = [
  {
    name: 'strips markdown fence with language tag',
    input: '```markdown\n## Heading\n- Item\n```',
    expected: '## Heading\n- Item'
  },
  {
    name: 'strips generic fence with trailing whitespace',
    input: '```\nContent line\n```\n',
    expected: 'Content line'
  },
  {
    name: 'keeps internal code fences',
    input: '## Section\n\n```\ncode block\n```\n',
    expected: '## Section\n\n```\ncode block\n```'
  },
  {
    name: 'returns original text when no fences present',
    input: 'Regular markdown\n\n- bullet 1',
    expected: 'Regular markdown\n\n- bullet 1'
  }
];

for (const testCase of cases) {
  const actual = normalizeMarkdownContent(testCase.input);
  assert.strictEqual(
    actual,
    testCase.expected,
    `normalizeMarkdownContent failed for "${testCase.name}". Expected:\n${testCase.expected}\nActual:\n${actual}`
  );
}

console.log('✅ normalizeMarkdownContent regression tests passed');
