import ts from "typescript";
import { unimplemented } from "./helpers.mts";

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
  value: string | number | boolean | ts.PseudoBigInt;
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

export type TypeModel =
  | LiteralType
  | PrimitiveType
  | ObjectType
  | UnionType;

export function typeToModel(
  checker: ts.TypeChecker,
  type: ts.Type,
  isOptional: boolean = false
): TypeModel {
  const aliasName = type.aliasSymbol?.escapedName.toString();
  if (tsTypeIsObject(type)) {
    const attributes: Record<string, TypeModel> = {};
    // console.log(`- object: ${checker.typeToString(type)}`);
    if (type.aliasSymbol) {
      // console.log("escapedName", type.aliasSymbol.escapedName);
    }
    for (const attr of checker.getPropertiesOfType(type)) {
      // console.log(`- attr: ${attr.escapedName}`);
      attributes[String(attr.escapedName)] = typeToModel(
        checker,
        checker.getTypeOfSymbol(attr),
        isSymbolOptional(attr)
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
      JSON.parse(type.intrinsicName)
    );
  } else if (type.isUnion()) {
    // console.log(`- inion: ${checker.typeToString(type)}`);
    return new UnionType(
      { isOptional, aliasName },
      type.types.map((member) => {
        // console.log(`- member`);
        return typeToModel(checker, member);
      })
    );
  }

  console.error(type);
  unimplemented(checker.typeToString(type));
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
        ts.TypeFlags.BooleanLiteral)
  );
}

// Stolen from TS sources
interface IntrinsicType extends ts.Type {
  intrinsicName: string; // Name of intrinsic type
  debugIntrinsicName: string | undefined;
  objectFlags: ts.ObjectFlags;
}
