import { assert } from "./helpers";

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
    for (const v of members) {
      yield* v(doInvalid);
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

  for (const [isValidValue, v] of value(doInvalid)) {
    for (const [isValidRest, rest] of rollObject(
      doInvalid,
      restObj
    )) {
      if (doInvalid) {
        yield [false, rest];
      }
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

export function combineValid(fn: ValueGenerator<Value>) {
  return [
    ...fn(false)
      .filter(([isValid, _]) => isValid)
      .map(([_, v]) => v),
  ];
}

export function combineInvalid(fn: ValueGenerator<Value>) {
  return [
    ...fn(true)
      .filter(([isValid, _]) => !isValid)
      .map(([_, v]) => v),
  ];
}
