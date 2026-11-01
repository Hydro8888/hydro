/**
 * openai@4 → node-fetch@2 → whatwg-url@5 → tr46 still loads Node's built-in
 * `punycode`, so every worker run printed "[DEP0040] DeprecationWarning: The
 * `punycode` module is deprecated" — harmless, but it reads like an error at the
 * top of every log. Hide exactly that warning; every other warning still prints.
 *
 * Must be the FIRST import of a worker entry point (before anything that loads openai).
 */

const emitWarning = process.emitWarning.bind(process) as (...args: unknown[]) => void;

process.emitWarning = ((warning: unknown, ...rest: unknown[]) => {
  const opts = rest[0];
  const code = typeof opts === 'object' && opts !== null ? (opts as { code?: unknown }).code : rest[1];
  const text = typeof warning === 'string' ? warning : warning instanceof Error ? warning.message : '';
  if (code === 'DEP0040' || text.includes('`punycode` module is deprecated')) return;
  emitWarning(warning, ...rest);
}) as typeof process.emitWarning;

export {};
