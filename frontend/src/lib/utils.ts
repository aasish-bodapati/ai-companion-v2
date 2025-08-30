// Utility functions for class name composition
// Strict-mode friendly, minimal replacement for clsx/tailwind-merge when not available.
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
