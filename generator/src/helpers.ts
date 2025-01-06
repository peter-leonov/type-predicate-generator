import { UnimplementedError } from "./errors";

export function unimplemented(
  message: string = "unimplemented"
): never {
  throw new UnimplementedError(message);
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
