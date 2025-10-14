/**
 * Markdown normalization utilities
 *
 * Ensures Gemini responses are free from wrapper code fences so that downstream
 * renderers display the content instead of treating it as literal Markdown.
 */

const FENCE_BLOCK_REGEX = /^```(?:[\w-]+)?\s*\n?([\s\S]*?)\n?```$/;

/**
 * Remove surrounding code fences (e.g. ```markdown ... ```) while leaving
 * legitimate fenced code blocks inside the document untouched.
 */
export function normalizeMarkdownContent(content: string): string {
  if (!content) {
    return content;
  }

  let normalized = content.replace(/\r\n/g, '\n').trim();

  const blockMatch = normalized.match(FENCE_BLOCK_REGEX);
  if (blockMatch) {
    normalized = blockMatch[1].trim();
  } else {
    const leadingFence = /^```(?:[\w-]+)?\s*\n?/;
    const trailingFence = /\n?```\s*$/;

    if (leadingFence.test(normalized) && trailingFence.test(normalized)) {
      normalized = normalized.replace(leadingFence, '').replace(trailingFence, '').trim();
    }
  }

  return normalized;
}

export default normalizeMarkdownContent;
