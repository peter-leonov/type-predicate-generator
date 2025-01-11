import ts from "typescript";
import { assert, unimplemented } from "./helpers";
import {
  UnsupportedEmptyEnum,
  UnsupportedPrimitiveType,
} from "./errors";

export type TypeOptions = {
  isOptional?: boolean;
  aliasName?: string;
};

function normilizeOptions(options: TypeOptions): TypeOptions {
  return {
    isOptional: Boolean(options.isOptional),
    aliasName: options.aliasName,
  };
}

interface BaseType {
  nameForErrors: string;
}

export class LiteralType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  value:
    | undefined
    | null
    | string
    | number
    | boolean
    | ts.PseudoBigInt;
  constructor(
    options: typeof this.options,
    value: typeof this.value
  ) {
    this.nameForErrors = "literal type";
    this.options = normilizeOptions(options);
    this.value = value;
  }
}

export class PrimitiveType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  primitive: "string" | "number" | "boolean";
  constructor(
    options: typeof this.options,
    primitive: typeof this.primitive
  ) {
    this.nameForErrors = "primitive type";
    this.options = normilizeOptions(options);
    this.primitive = primitive;
  }
}

export class ObjectType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  attributes: { [key: string]: TypeModel };
  optionalAttributes: Set<string>;
  constructor(
    options: typeof this.options,
    attributes: typeof this.attributes,
    optional: typeof this.optionalAttributes = new Set()
  ) {
    this.nameForErrors = "object type";
    this.options = normilizeOptions(options);
    this.attributes = attributes;
    this.optionalAttributes = optional;
  }
}

export class UnionType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  types: TypeModel[];
  constructor(
    options: typeof this.options,
    types: typeof this.types
  ) {
    this.nameForErrors = "union type";
    this.options = normilizeOptions(options);
    this.types = types;
  }
}

export class ArrayType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  element: TypeModel;
  constructor(
    options: typeof this.options,
    element: typeof this.element
  ) {
    this.nameForErrors = "array type";
    this.options = normilizeOptions(options);
    this.element = element;
  }
}

export class AliasType implements BaseType {
  nameForErrors: string;
  options: TypeOptions;
  name: string;
  constructor(options: typeof this.options, name: typeof this.name) {
    this.nameForErrors = "type alias";
    this.options = normilizeOptions(options);
    this.name = name;
  }
}

export type TypeModel =
  | LiteralType
  | PrimitiveType
  | ObjectType
  | UnionType
  | ArrayType
  | AliasType;

export function symbolToModel(
  checker: ts.TypeChecker,
  symbol: ts.Symbol
): TypeModel {
  // TODO move the depth == 0 logic here and get rid of the aliasName
  // by dealing with it here and returning the RootTypeAlias type model
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  return typeToModelInner(checker, type, symbol, 0);
}

export function typeToModelInner(
  checker: ts.TypeChecker,
  type: ts.Type,
  symbol: ts.Symbol | null,
  depth: number
): TypeModel {
  if (depth >= 100) {
    throw new Error(
      `recursion depth reached >= 100 at type ${checker.typeToString(
        type
      )}, there must be a bug, please report with the minimal type example`
    );
  }

  const isOptional = symbol ? isSymbolOptional(symbol) : false;
  // const type = tsSymbolIsTypeAlias(symbol)
  //   ? checker.getDeclaredTypeOfSymbol(symbol)
  //   : checker.getTypeOfSymbol(symbol);

  // The `type.aliasSymbol` is not defined for common types like `undefined`.
  // Monkey patching does not work as the same type object is reused everywhere.
  // This is not an issue for nested types as using a dedicated guard for
  // a primitive type like `null` is not desired.
  // For example for:
  //   type A = null
  //   type X = { a: A }
  // we don't want to use `isA(a)` where a simple `a === null` could do.

  // The issue with `type.aliasSymbol` being undefined arises only when
  // this is the root type as this way we're loosing the actual type name.
  // For example in:
  //   type X = null
  // the `type.aliasSymbol` is missing in type of `X`. So for the root type
  // we're also manually passing the defining symbol around.

  if (depth >= 1) {
    // For nested references
    const { aliasSymbol } = type;
    if (aliasSymbol) {
      const aliasName = aliasSymbol.escapedName.toString();
      return new AliasType({ isOptional, aliasName }, aliasName);
    }
  }

  let aliasName: string | undefined = undefined;
  // For the root
  if (depth == 0) {
    aliasName = symbol?.escapedName.toString();
  }

  // const aliasName = type.aliasSymbol?.escapedName.toString();

  if (tsTypeIsArray(checker, type)) {
    const elementType = checker.getTypeArguments(type)[0];
    assert(elementType, "expecting the first type argument");
    return new ArrayType(
      { isOptional, aliasName },
      typeToModelInner(checker, elementType, null, depth + 1)
    );
    console.log(type);
  } else if (tsTypeIsObject(type)) {
    const attributes: Record<string, TypeModel> = {};
    // console.log(`- object: ${checker.typeToString(type)}`);
    const optionalAttributes = new Set<string>();
    for (const attr of checker.getPropertiesOfType(type)) {
      // console.log(`- attr: ${attr.escapedName}`);
      const model = typeToModelInner(
        checker,
        checker.getTypeOfSymbol(attr),
        attr,
        depth + 1
      );
      const attrName = String(attr.escapedName);
      if (model.options.isOptional) {
        optionalAttributes.add(attrName);
      }
      attributes[attrName] = model;
    }
    return new ObjectType(
      { isOptional, aliasName },
      attributes,
      optionalAttributes
    );
  } else if (tsTypeIsPrimitive(type)) {
    const intrinsicName = (type as IntrinsicType)?.intrinsicName;
    const primitive = intrinsicName || checker.typeToString(type);
    if (
      primitive !== "string" &&
      primitive !== "number" &&
      primitive !== "boolean"
    ) {
      throw new UnsupportedPrimitiveType(primitive);
    }
    return new PrimitiveType({ isOptional, aliasName }, primitive);
  } else if (type.isLiteral()) {
    // console.log(`- literal: ${checker.typeToString(type)}`);
    return new LiteralType({ isOptional, aliasName }, type.value);
  } else if (tsTypeIsLiteral(type)) {
    // console.log(`- literal: ${checker.typeToString(type)}`);
    return new LiteralType(
      { isOptional, aliasName },
      type.intrinsicName === "undefined"
        ? undefined
        : JSON.parse(type.intrinsicName)
    );
  } else if (type.isUnion()) {
    // console.log(`- inion: ${checker.typeToString(type)}`);
    return new UnionType(
      { isOptional, aliasName },
      type.types.map((member) => {
        // console.log(`- member`);
        return typeToModelInner(checker, member, null, depth + 1);
      })
    );
  } else if (tsTypeIsEnum(type)) {
    const exports = type.symbol.exports;
    // empty enum
    if (exports && exports.size == 0) {
      throw new UnsupportedEmptyEnum(checker.typeToString(type));
    }
  }

  unimplemented(checker.typeToString(type));
}

function tsTypeIsArray(
  checker: ts.TypeChecker,
  type: ts.Type
): type is ts.TypeReference {
  return checker.isArrayType(type);
}

function isSymbolOptional(s: ts.Symbol) {
  return Boolean(s.flags & ts.SymbolFlags.Optional);
}

function tsTypeIsObject(type: ts.Type): type is ts.ObjectType {
  return Boolean(type.flags & ts.TypeFlags.Object);
}

function tsTypeIsPrimitive(type: ts.Type) {
  return Boolean(
    type.flags &
      (ts.TypeFlags.String |
        ts.TypeFlags.Number |
        ts.TypeFlags.Boolean)
  );
}

function tsTypeIsLiteral(type: ts.Type): type is IntrinsicType {
  return Boolean(
    type.flags &
      (ts.TypeFlags.StringLiteral |
        ts.TypeFlags.NumberLiteral |
        ts.TypeFlags.BooleanLiteral |
        ts.TypeFlags.Null |
        ts.TypeFlags.Undefined)
  );
}

function tsTypeIsEnum(type: ts.Type): type is ts.EnumType {
  return Boolean(type.flags & ts.TypeFlags.Enum);
}

// Stolen from TS sources
interface IntrinsicType extends ts.Type {
  intrinsicName: string; // Name of intrinsic type
  debugIntrinsicName: string | undefined;
  objectFlags: ts.ObjectFlags;
}

function tsSymbolIsTypeAlias(s: ts.Symbol) {
  return Boolean(s.flags & ts.SymbolFlags.TypeAlias);
}
