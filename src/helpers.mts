export function unimplemented(
  message: string = "unimplemented"
): never {
  throw new Error(message);
}

export function ok(value: unknown): asserts value {
  if (!value) {
    throw new Error(`${value} is not truthy`);
  }
}

export function assert(value: unknown): asserts value {
  if (!value) {
    throw new Error(`${value} is not truthy`);
  }
}
