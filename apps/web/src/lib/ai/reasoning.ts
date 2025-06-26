export function splitReasoningSteps(text: string): string[] {
  const stepRegex = /\*\*(.+?)\*\*/g;
  const matches = [...text.matchAll(stepRegex)];
  if (matches.length === 0) return [];

  const steps: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][0];
    const start = matches[i].index + heading.length;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    const description = text.slice(start, end).trim();
    steps.push(`${heading}\n\n${description}`);
  }
  return steps;
}
