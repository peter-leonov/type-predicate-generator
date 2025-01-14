/**
 * A module wide comment here :)
 *
 * Main invariant: do not reuse the values produced by the value funtions
 * (value, union, array, object), they are supposed to be used at the same
 * nesting as the same attribute, union member, etc. The API is ever changing
 * and relies on this invariant.
 */

import { assert, unimplemented, unreachable } from "./helpers";
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

const MODE_VALID = "valid";
const MODE_INVALID = "invalid";
type Mode = typeof MODE_VALID | typeof MODE_INVALID;

export type Combinator = (mode: Mode) => Generator<[Mode, Value]>;

export function values(values: Value[]): Combinator {
  assert(
    values.length > 0,
    "values() has to have at least one value"
  );
  return function* (mode) {
    if (mode == MODE_VALID) {
      for (const value of values) {
        yield [MODE_VALID, value];
      }
    } else {
      yield [MODE_INVALID, invalidValue];
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
  return function* (mode) {
    if (mode === MODE_VALID) {
      yield [MODE_VALID, new Reference(typeName, true)];
    } else {
      yield [MODE_INVALID, new Reference(typeName, false)];
    }
  };
}

export function union(members: Combinator[]): Combinator {
  return function* (mode) {
    const seenValid = new Set();
    const seenInvalid = new Set();
    for (const m of members) {
      for (const tuple of m(mode)) {
        const [mode, v] = tuple;
        if (mode === MODE_VALID) {
          if (seenValid.has(v)) {
            continue;
          }
          seenValid.add(v);
        } else if (mode === MODE_INVALID) {
          if (seenInvalid.has(v)) {
            continue;
          }
          seenInvalid.add(v);
        } else {
          mode satisfies never;
          unreachable();
        }

        yield tuple;
      }
    }
  };
}

export function array(value: Combinator): Combinator {
  return function* (mode) {
    if (mode === MODE_VALID) {
      yield [MODE_VALID, []];
      for (const [mode, v] of value(MODE_VALID)) {
        assert(mode === MODE_VALID, "must be a valid value");
        yield [mode, [v]];
      }
    } else if (mode === MODE_INVALID) {
      yield [MODE_INVALID, invalidValue];
      for (const [mode, v] of value(MODE_INVALID)) {
        assert(mode === MODE_INVALID, "must be an invalid value");
        yield [mode, [v]];
      }
    } else {
      mode satisfies never;
      unreachable();
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
  return function* (mode) {
    if (mode === MODE_VALID) {
      yield* rollObject(MODE_VALID, obj, optionalAttributes);
    } else if (mode === MODE_INVALID) {
      // testing `typeof v === "object"`
      yield [MODE_INVALID, invalidValue];
      // testing `v !== null`
      yield [MODE_INVALID, null];
      yield* rollObject(MODE_INVALID, obj, optionalAttributes);
    } else {
      mode satisfies never;
      unreachable();
    }
  };
}

function* rollObject(
  mode: Mode,
  obj: Record<string, Combinator>,
  optionalAttributes: Set<string>
): Generator<[Mode, Record<string, Value>]> {
  const keys = Object.keys(obj);
  if (keys.length == 0) {
    if (mode === MODE_VALID) {
      yield [MODE_VALID, {}];
      return;
    } else if (mode === MODE_INVALID) {
      return;
    } else {
      mode satisfies never;
      unreachable();
    }
  }

  const [key, ...restKeys] = keys;
  assert(key, "at least one property is present");

  const restObj = pick(obj, restKeys);

  const value = obj[key];
  assert(value);

  const isOptional = optionalAttributes.has(key);

  if (mode === MODE_VALID) {
    let first = true;
    let hasLastValue = false;
    let lastValue: Value;
    for (const [modeRest, rest] of rollObject(
      MODE_VALID,
      restObj,
      optionalAttributes
    )) {
      assert(modeRest === MODE_VALID, "must be a valid rest");

      // 1. with the key + all the values * first of the rest
      if (first) {
        first = false;
        for (const [modeValue, v] of value(MODE_VALID)) {
          assert(modeValue === MODE_VALID, "must be a valid value");

          hasLastValue = true;
          lastValue = v;

          yield [
            MODE_VALID,
            {
              [key]: v,
              ...rest,
            },
          ];
        }

        // 2. without the optional key + first of the rest
        if (isOptional) {
          yield [MODE_VALID, rest];
        }
      } else {
        // 3. with the key + last value * the rest of the rest
        if (hasLastValue) {
          yield [
            MODE_VALID,
            {
              [key]: lastValue,
              ...rest,
            },
          ];
        }
      }
    }
  } else if (mode === MODE_INVALID) {
    for (const [modeRest, rest] of rollObject(
      MODE_VALID,
      restObj,
      optionalAttributes
    )) {
      assert(modeRest === MODE_VALID, "must be a valid rest");

      // 1. with the key + all invalid values * first of the valid rest
      for (const [modeValue, v] of value(MODE_INVALID)) {
        assert(
          modeValue === MODE_INVALID,
          "must be an invalid value"
        );
        yield [
          MODE_INVALID,
          {
            [key]: v,
            ...rest,
          },
        ];
      }

      // 2. without non-optional key + first of the valid rest
      if (!isOptional) {
        yield [MODE_INVALID, rest];
      }

      break;
    }

    let first = true;
    let hasLastValue = false;
    let lastValue: Value;
    for (const [modeRest, rest] of rollObject(
      MODE_INVALID,
      restObj,
      optionalAttributes
    )) {
      assert(modeRest === MODE_INVALID, "must be an invalid rest");

      // 4. with the key + all valid values * first of the invalid rest
      if (first) {
        first = false;
        for (const [modeValue, v] of value(MODE_VALID)) {
          assert(modeValue === MODE_VALID, "must be a valid value");

          hasLastValue = true;
          lastValue = v;

          yield [
            MODE_INVALID,
            {
              [key]: v,
              ...rest,
            },
          ];
        }
      } else {
        // 3. with the key + one valid value * all of the invalid rest
        if (hasLastValue) {
          yield [
            MODE_INVALID,
            {
              [key]: lastValue,
              ...rest,
            },
          ];
        }
      }
    }
  } else {
    mode satisfies never;
    unreachable();
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
  return [...fn(MODE_VALID)].map(
    ([mode, v]) => (assert(mode === MODE_VALID), v)
  );
}

export function combineInvalid(fn: Combinator) {
  return [...fn(MODE_INVALID)].map(
    ([mode, v]) => (assert(mode === MODE_INVALID), v)
  );
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
