import { type TypeModel } from "./model";

export class UnimplementedError extends Error {}

export class TypeScriptError extends Error {}

export class UnsupportedError extends Error {}

export class UnsupportedUnionMember extends UnsupportedError {
  constructor(type: TypeModel) {
    super(
      `The ${type.nameForErrors} is not supported in unions. Try extracting it into a separate type alias. See here for more: https://github.com/peter-leonov/typescript-predicate-generator/issues/1`
    );
  }
}

export class UnsupportedEmptyEnum extends UnsupportedError {
  constructor(aliasName: string) {
    super(
      `The ${aliasName} type is defined as an empty enum (enum with no members). This type is not supported by the generator as it has no values to match against (much like never). See here for more: https://github.com/peter-leonov/typescript-predicate-generator/issues/11`
    );
  }
}

export function explainError(
  err: unknown,
  inBrowser: boolean
): string {
  const title =
    err instanceof UnimplementedError
      ? "Unimplemented error\nCongrats, you've found a missing feature!"
      : err instanceof UnsupportedError
      ? "Generation error\nThe Generator stumbled upon something that does not fit."
      : err instanceof TypeScriptError
      ? "TypeScript compilation error\nLikely it's a syntax error, if not then it's a bug."
      : "Unknown error\nSomething went unexpectedly wrong.";

  const stacktrace = inBrowser
    ? `For the full error message with the stacktrace
and the rest of the logs please check the browser console.`
    : "To see the the stacktrace use the --withStacktrace switch.";

  return `${title}

${err}

${stacktrace}

If you feel this is a bug in the generator, pretty please report it here:
https://github.com/peter-leonov/typescript-predicate-generator/issues/new
`;
}
