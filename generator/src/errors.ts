import { type TypeModel } from "./model";

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
