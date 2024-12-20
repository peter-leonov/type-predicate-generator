import ts from "typescript";
import { unimplemented } from "./helpers.mts";
import { ok } from "node:assert";

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

export class LiteralType {
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
    this.options = normilizeOptions(options);
    this.value = value;
  }
}

export class PrimitiveType {
  options: TypeOptions;
  primitive: string;
  constructor(
    options: typeof this.options,
    primitive: typeof this.primitive
  ) {
    this.options = normilizeOptions(options);
    this.primitive = primitive;
  }
}

export class ObjectType {
  options: TypeOptions;
  attributes: { [key: string]: TypeModel };
  constructor(
    options: typeof this.options,
    attributes: typeof this.attributes
  ) {
    this.options = normilizeOptions(options);
    this.attributes = attributes;
  }
}

export class UnionType {
  options: TypeOptions;
  types: TypeModel[];
  constructor(
    options: typeof this.options,
    types: typeof this.types
  ) {
    this.options = normilizeOptions(options);
    this.types = types;
  }
}

export class ArrayType {
  options: TypeOptions;
  element: TypeModel;
  constructor(
    options: typeof this.options,
    element: typeof this.element
  ) {
    this.options = normilizeOptions(options);
    this.element = element;
  }
}

export class ReferenceType {
  options: TypeOptions;
  name: string;
  constructor(options: typeof this.options, name: typeof this.name) {
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
  | ReferenceType;

export function typeToModel(
  checker: ts.TypeChecker,
  type: ts.Type,
  symbol: ts.Symbol | null,
  depth: number = 0
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
      return new ReferenceType({ isOptional, aliasName }, aliasName);
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
    ok(elementType);
    return new ArrayType(
      { isOptional, aliasName },
      typeToModel(checker, elementType, null, depth + 1)
    );
    console.log(type);
  } else if (tsTypeIsObject(type)) {
    const attributes: Record<string, TypeModel> = {};
    // console.log(`- object: ${checker.typeToString(type)}`);
    for (const attr of checker.getPropertiesOfType(type)) {
      // console.log(`- attr: ${attr.escapedName}`);
      attributes[String(attr.escapedName)] = typeToModel(
        checker,
        checker.getTypeOfSymbol(attr),
        attr,
        depth + 1
      );
    }
    return new ObjectType({ isOptional, aliasName }, attributes);
  } else if (tsTypeIsPrimitive(type)) {
    // console.log(`- primitive: ${checker.typeToString(type)}`);
    return new PrimitiveType(
      { isOptional, aliasName },
      checker.typeToString(type)
    );
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
        return typeToModel(checker, member, null, depth + 1);
      })
    );
  }

  console.error(type);
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

// Stolen from TS sources
interface IntrinsicType extends ts.Type {
  intrinsicName: string; // Name of intrinsic type
  debugIntrinsicName: string | undefined;
  objectFlags: ts.ObjectFlags;
}

function tsSymbolIsTypeAlias(s: ts.Symbol) {
  return Boolean(s.flags & ts.SymbolFlags.TypeAlias);
}
