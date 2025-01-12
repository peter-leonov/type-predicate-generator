import { UnimplementedError, UnreachableError } from "./errors";

export function unimplemented(
  message: string = "unimplemented"
): never {
  throw new UnimplementedError(message);
}

export function unreachable(message: string = "unreachable"): never {
  throw new UnreachableError(message);
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
