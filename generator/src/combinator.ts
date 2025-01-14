/**
 * A module wide comment here :)
 *
 * Main invariant: do not reuse the values produced by the value funtions
 * (value, union, array, object), they are supposed to be used at the same
 * nesting as the same attribute, union member, etc. The API is ever changing
 * and relies on this invariant.
 */

import { assert, unimplemented } from "./helpers";
import {
  AliasType,
  ArrayType,
  LiteralType,
  ObjectType,
  PrimitiveType,
  TypeModel,
  UnionType,
} from "./model";

/**
 * A unique value used in tests to mark a wrong value that does not match
 * anything esle but itself and cannot be expressed in the subset of the
 * type system supported by the generator.
 *
 * This explicit value covers cases when in a union one member's invalid value
 * is a valid for the other. For example in:
 * ```ts
 * type X = string | number
 * ```
 * the `string` value might choose a `1` as it's invalid value,
 * but `1` is a valid value for the `number` thus the union as a whole
 * never yields an invalid value.
 *
 * If this special value becomes a blocker it should be possible to
 * inspect the union values in the generator and infer a safe invalid value
 * per union.
 */
export const invalidValue = Symbol("invalidValue");

export type Value =
  | number
  | string
  | null
  | undefined
  | boolean
  | { [key: string]: Value }
  | Reference
  | Value[]
  | typeof invalidValue;

export type Combinator = (
  doInvalid: boolean
) => Generator<[boolean, Value]>;

export function values(values: Value[]): Combinator {
  assert(
    values.length > 0,
    "values() has to have at least one value"
  );
  return function* (doInvalid) {
    if (doInvalid) {
      yield [false, invalidValue];
      return;
    }
    for (const value of values) {
      yield [true, value];
    }
  };
}

export class Reference {
  typeName: string;
  isValid: boolean;
  constructor(typeName: string, isValid: boolean) {
    this.typeName = typeName;
    this.isValid = isValid;
  }
}

export function reference(typeName: string): Combinator {
  return function* (doInvalid) {
    if (doInvalid) {
      yield [false, new Reference(typeName, false)];
    } else {
      yield [true, new Reference(typeName, true)];
    }
  };
}

export function union(members: Combinator[]): Combinator {
  return function* (doInvalid) {
    for (const m of members) {
      yield* m(doInvalid);
    }
  };
}

export function array(value: Combinator): Combinator {
  return function* (doInvalid) {
    if (doInvalid) {
      yield [false, invalidValue];
      for (const [isValid, v] of value(true)) {
        assert(!isValid, "must be an invalid value");
        yield [isValid, [v]];
      }
    } else {
      yield [true, []];
      for (const [isValid, v] of value(false)) {
        assert(isValid, "must be a valid value");
        yield [isValid, [v]];
      }
    }
  };
}

/**
 * This is the only product type here, the rest are sum types.
 * So please keep an eye on how many combinations object() produces.
 *
 * Right now it generates all valid / invalid values per field without
 * permuting them. This does not cover the whole exponential space of
 * values, but still gives 100% test coverage for the predicates.
 * Effectively it linearizes object() into a sum type.
 */
export function object(
  obj: Record<string, Combinator>,
  optionalAttributes: Set<string>
): Combinator {
  return function* (doInvalid) {
    if (doInvalid) {
      // testing `typeof v === "object"`
      yield [false, invalidValue];
      // testing `v !== null`
      yield [false, null];
      yield* rollObject(true, obj, optionalAttributes);
    } else {
      yield* rollObject(false, obj, optionalAttributes);
    }
  };
}

function* rollObject(
  doInvalid: boolean,
  obj: Record<string, Combinator>,
  optionalAttributes: Set<string>
): Generator<[boolean, Record<string, Value>]> {
  const keys = Object.keys(obj);
  if (keys.length == 0) {
    if (doInvalid) {
      return;
    } else {
      yield [true, {}];
      return;
    }
  }

  const [key, ...restKeys] = keys;
  assert(key, "at least one property is present");

  const restObj = pick(obj, restKeys);

  const value = obj[key];
  assert(value);

  const isOptional = optionalAttributes.has(key);

  if (doInvalid) {
    // 1. without non-optional key + one of the valid rest
    if (!isOptional) {
      for (const [isValidRest, rest] of rollObject(
        false,
        restObj,
        optionalAttributes
      )) {
        assert(isValidRest, "must be a valid rest");
        yield [
          false,
          {
            ...rest,
          },
        ];
        break;
      }
    }

    // 2. with the key + all invalid values * one of the valid rest
    for (const [isValidValue, v] of value(true)) {
      assert(!isValidValue, "must be an invalid value");
      for (const [isValidRest, rest] of rollObject(
        false,
        restObj,
        optionalAttributes
      )) {
        assert(isValidRest, "must be a valid rest");
        yield [
          isValidValue && isValidRest,
          {
            [key]: v,
            ...rest,
          },
        ];
        break;
      }
    }

    // 3. with the key + one valid value * all of the invalid rest
    for (const [isValidValue, v] of value(false)) {
      assert(isValidValue, "must be a valid value");
      for (const [isValidRest, rest] of rollObject(
        true,
        restObj,
        optionalAttributes
      )) {
        assert(!isValidRest, "must be an invalid rest");
        yield [
          isValidValue && isValidRest,
          {
            [key]: v,
            ...rest,
          },
        ];
      }
      break;
    }
  } else {
    let first = true;
    let hasLastValue = false;
    let lastValue: Value;
    for (const [isValidRest, rest] of rollObject(
      false,
      restObj,
      optionalAttributes
    )) {
      assert(isValidRest, "must be a valid rest");

      // 1. with the key + all the values * first of the rest
      if (first) {
        first = false;
        for (const [isValidValue, v] of value(false)) {
          assert(isValidValue, "must be a valid value");

          hasLastValue = true;
          lastValue = v;

          yield [
            true,
            {
              [key]: v,
              ...rest,
            },
          ];
        }

        // 2. without the optional key + first of the rest
        if (isOptional) {
          yield [true, rest];
        }
      } else {
        // 3. with the key + last value * the rest of the rest
        if (hasLastValue) {
          yield [
            true,
            {
              [key]: lastValue,
              ...rest,
            },
          ];
        }
      }
    }
  }
}

function pick<T>(
  obj: Record<string, T>,
  arr: string[]
): Record<string, T> {
  return arr.reduce<Record<string, T>>((acc, attr) => {
    if (attr in obj) {
      acc[attr] = obj[attr] as T;
    }
    return acc;
  }, {});
}

export function combineValid(fn: Combinator) {
  return [...fn(false)].map(([isValid, v]) => (assert(isValid), v));
}

export function combineInvalid(fn: Combinator) {
  return [...fn(true)].map(([isValid, v]) => (assert(!isValid), v));
}

export function modelToCombinator(model: TypeModel): Combinator {
  if (model instanceof LiteralType) {
    return values([model.value]);
  } else if (model instanceof PrimitiveType) {
    switch (model.primitive) {
      case "string":
        // using "" to cover for checks like `!x` where `""` would mean `false`
        return values(["", "string"]);
      case "number":
        // using 0 to cover for checks like `!x` where `0` would mean `false`
        return values([0, 42]);
      case "boolean":
        return values([true, false]);
    }
    model.primitive satisfies never;
    unimplemented(
      `primitive type ${model.primitive} is not implemented`
    );
  } else if (model instanceof ObjectType) {
    return object(
      mapObjectValues(model.attributes, modelToCombinator),
      model.optionalAttributes
    );
  } else if (model instanceof UnionType) {
    return union(model.types.map(modelToCombinator));
  } else if (model instanceof ArrayType) {
    return array(modelToCombinator(model.element));
  } else if (model instanceof AliasType) {
    return reference(model.name);
  }

  model satisfies never;
  unimplemented(
    `model of class ${className(model)} is not implemented`
  );
}

function className(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    return value.constructor.name;
  }
  return "undefined";
}

function mapObjectValues<T, U>(
  src: Record<string, T>,
  f: (v: T) => U
): Record<string, U> {
  const dst: Record<string, U> = {};
  for (var k in src) {
    dst[k] = f(src[k] as any);
  }
  return dst;
}
