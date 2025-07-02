/**
 * Format validation errors from a typical class-validator shape.
 * @param errors The raw `ValidationError[]` array
 * @returns A single string suitable for displaying in a toast or alert.
 */
export function formatApiErrors(errors: any[]): string | undefined {
  if (!Array.isArray(errors)) return undefined;

  const lines = errors.flatMap((err) => {
    if (!err?.constraints) return [];
    return Object.values(err.constraints).map((msg) => `${msg}`);
  });

  if (lines.length === 0) return undefined;

  return lines.join('\n');
}
