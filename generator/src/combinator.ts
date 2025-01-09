import { PseudoBigInt } from "typescript";
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
 * Main invariant: do not reuse the values produced by the value funtions
 * (value, union, array, object), they each get a unique ID that is
 * used to remember if the value has produced a broken value.
 *
 * If this becomes a problem, the next in line solution is to again
 * use value paths as IDs and store per path state.
 */

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
const invalidValue: any = Symbol("invalidValue");

export type Value =
  | number
  | string
  | null
  | undefined
  | boolean
  | { [key: string]: Value }
  | PseudoBigInt
  | Value[];

export type ValueGenerator<T> = (
  doInvalid: boolean
) => Generator<[boolean, T]>;

export function value<T>(value: T): ValueGenerator<T> {
  return function* (doInvalid: boolean) {
    if (doInvalid) {
      yield [false, invalidValue];
    }
    yield [true, value];
  };
}

export function union<T>(
  members: ValueGenerator<T>[]
): ValueGenerator<T> {
  return function* (doInvalid: boolean) {
    for (const m of members) {
      yield* m(doInvalid);
    }
  };
}

export function array<T>(
  value: ValueGenerator<T>
): ValueGenerator<T[]> {
  return function* (doInvalid: boolean) {
    if (doInvalid) {
      yield [false, invalidValue];
    }
    yield [true, []];
    for (const [isValid, v] of value(doInvalid)) {
      yield [isValid, [v]];
    }
  };
}

export function object<T>(
  obj: Record<string, ValueGenerator<T>>
): ValueGenerator<T> {
  return function* (doInvalid: boolean) {
    if (doInvalid) {
      yield [false, invalidValue];
    }
    yield* rollObject(doInvalid, obj) as Generator<any>;
  };
}

function* rollObject<T>(
  doInvalid: boolean,
  obj: Record<string, ValueGenerator<T>>
): Generator<[boolean, Record<string, T>]> {
  const keys = Object.keys(obj);
  if (keys.length == 0) {
    yield [true, {}];
    return;
  }

  const [key, ...restKeys] = keys;
  assert(key, "at least one property must be present at this point");

  const restObj = pick(obj, restKeys);

  const value = obj[key];
  assert(value);

  if (doInvalid) {
    for (const [_, rest] of rollObject(false, restObj)) {
      yield [false, rest];
    }
  }

  for (const [isValidValue, v] of value(doInvalid)) {
    for (const [isValidRest, rest] of rollObject(
      doInvalid && isValidValue,
      restObj
    )) {
      yield [
        isValidValue && isValidRest,
        {
          [key]: v,
          ...rest,
        },
      ];
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

export function combineValid(fn: ValueGenerator<Value>) {
  return [...fn(false).map(([isValid, v]) => (assert(isValid), v))];
}

export function combineInvalid(fn: ValueGenerator<Value>) {
  return [
    ...fn(true)
      .filter(([isValid, _]) => !isValid)
      .map(([_, v]) => v),
  ];
}

export function modelToCombinator(
  model: TypeModel
): ValueGenerator<Value> {
  if (model instanceof LiteralType) {
    return value(model.value);
  } else if (model instanceof PrimitiveType) {
    switch (model.primitive) {
      case "string":
        return value("string");
      case "number":
        return union([
          // adding 0 to cover for checks like `!x` where `0` would meant `false`
          value(0),
          // any arbitrary number
          value(42),
        ]);
      case "boolean":
        return union([value(true), value(false)]);
    }
    model.primitive satisfies never;
    unimplemented(
      `primitive type ${model.primitive} is not implemented`
    );
  } else if (model instanceof ObjectType) {
    return object(
      mapObjectValues(model.attributes, modelToCombinator)
    );
  } else if (model instanceof UnionType) {
    return union(model.types.map(modelToCombinator));
  } else if (model instanceof ArrayType) {
    return array(modelToCombinator(model));
  } else if (model instanceof AliasType) {
    unimplemented(
      "AliasType test generation is to be implemented soon"
    );
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
