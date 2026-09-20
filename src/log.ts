const SEPARATOR = "─".repeat(64);

export function logBlock(
  title: string,
  fields: Record<string, unknown>,
): void {
  const keys = Object.keys(fields);
  const width = keys.length > 0 ? Math.max(...keys.map((k) => k.length)) : 0;
  const lines = [SEPARATOR, title, SEPARATOR];

  for (const [label, value] of Object.entries(fields)) {
    lines.push(`  ${label.padEnd(width)} : ${String(value)}`);
  }

  lines.push(SEPARATOR);
  console.log(`\n${lines.join("\n")}\n`);
}
