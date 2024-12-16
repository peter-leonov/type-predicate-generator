export function unimplemented(
  message: string = "unimplemented"
): never {
  throw new Error(message);
}
