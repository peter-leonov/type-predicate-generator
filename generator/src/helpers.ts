export function unimplemented(
  message: string = "unimplemented"
): never {
  throw new Error(message);
}

class AssertionError extends Error {}

export function assert(
  value: unknown,
  message?: string
): asserts value {
  if (!value) {
    throw new AssertionError(message ?? `${value} is not truthy`);
  }
}
