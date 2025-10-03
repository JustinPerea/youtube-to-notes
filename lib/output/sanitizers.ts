export function enforceNonConversationalOpening(content: string, requiredPrefix: string): string {
  if (!content) return content;
  const normalized = content.replace(/\r\n/g, '\n').trimStart();
  const exactIndex = normalized.indexOf(requiredPrefix);
  if (exactIndex === 0) {
    return normalized;
  }
  if (exactIndex > 0) {
    return normalized.slice(exactIndex);
  }
  const tutorialGuideRegex = /#?\s*Tutorial Guide:/i;
  const match = normalized.match(tutorialGuideRegex);
  if (match) {
    const index = normalized.indexOf(match[0]);
    const remainder = normalized.slice(index + match[0].length).trimStart();
    return `${requiredPrefix} ${remainder}`.trimEnd();
  }
  return `${requiredPrefix}\n${normalized}`;
}

export function sanitizeTutorialGuideOutput(
  content: string,
  templateId: string,
  requiredPrefix: string = '# Tutorial Guide:'
): string {
  if (!content) {
    return content;
  }
  if (templateId === 'tutorial-guide') {
    return enforceNonConversationalOpening(content, requiredPrefix).trimStart();
  }

  const normalized = content.replace(/\r\n/g, '\n').trimStart();
  const conversationalPrefixes = [
    /^okay\b/i,
    /^all right\b/i,
    /^alright\b/i,
    /^sure\b/i,
    /^absolutely\b/i,
    /^here'?s\b/i,
    /^let'?s\b/i,
    /^so\b/i
  ];

  for (const pattern of conversationalPrefixes) {
    if (pattern.test(normalized)) {
      const withoutPrefix = normalized.replace(pattern, '').trimStart().replace(/^,\s*/, '').trimStart();
      return withoutPrefix.length > 0 ? withoutPrefix : normalized;
    }
  }

  return normalized;
}
