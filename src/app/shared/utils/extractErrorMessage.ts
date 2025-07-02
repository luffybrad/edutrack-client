import { formatApiErrors } from './formatApiError';

/**
 * Capitalize the first letter of a string.
 */
function capitalizeFirst(input: string): string {
  if (!input) return '';
  return input.charAt(0).toUpperCase() + input.slice(1);
}

/**
 * Capitalize each line of a multi-line message.
 */
function capitalizeEachLine(input: string): string {
  return input
    .split('\n')
    .map((line) => capitalizeFirst(line.trim()))
    .join('\n');
}

export function extractErrorMessage(err: any): string {
  const raw =
    formatApiErrors(err?.error?.errors) ||
    err?.error?.message ||
    'Unknown error';

  return capitalizeEachLine(raw.trim());
}
