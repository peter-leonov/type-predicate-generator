import { type TypeModel } from "./model";

export class UnimplementedError extends Error {}
export class UnreachableError extends Error {}

export class TypeScriptError extends Error {}

export class InputError extends Error {}

export class MissingExportedType extends InputError {
  constructor(
    source: string,
    missingTypeName: string,
    guarderTypes: string[]
  ) {
    super(
      `The type ${missingTypeName} is referenced in ${source} but there is no predicate generated for ${missingTypeName}. Here is the list of types having predicates: ${guarderTypes.join(
        ", "
      )}. Likely it's because the referenced type is not exported. See here for more: https://github.com/peter-leonov/type-predicate-generator/issues/16`
    );
  }
}

export class UnsupportedError extends Error {}

export class UnsupportedUnionMember extends UnsupportedError {
  constructor(types: TypeModel[]) {
    const names = types.map((t) => t.nameForErrors);
    super(
      `The combination of types ${names.join(
        ", "
      )} is not supported in unions. Try extracting object types into their separate type aliases. See here for more: https://github.com/peter-leonov/type-predicate-generator/issues/1`
    );
  }
}

export class UnsupportedEmptyEnum extends UnsupportedError {
  constructor(aliasName: string) {
    super(
      `The ${aliasName} type is defined as an empty enum (enum with no members). This type is not supported by the generator as it has no values to match against (much like never). See here for more: https://github.com/peter-leonov/type-predicate-generator/issues/11`
    );
  }
}

export class UnsupportedPseudoBigInt extends UnsupportedError {
  constructor() {
    super(
      `The PseudoBigInt TS built-in type is currently not supported. See here for more: https://github.com/peter-leonov/type-predicate-generator/issues/14`
    );
  }
}

export class UnsupportedPrimitiveType extends UnsupportedError {
  constructor(aliasName: string) {
    super(
      `The primitive ${aliasName} type is nor currently supported by the generator. See here for more: https://github.com/peter-leonov/type-predicate-generator/issues/12`
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
      : err instanceof InputError
      ? "Input error\nThe Generator needs your help to change the input files."
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
https://github.com/peter-leonov/type-predicate-generator/issues/new
`;
}
