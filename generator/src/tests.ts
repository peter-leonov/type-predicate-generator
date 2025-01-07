import { assert } from "./helpers";

export type ValueGenerator<T> = () => Generator<T>;

export function value<T>(value: T): ValueGenerator<T> {
  return function* () {
    yield value;
  };
}

export function union<T>(
  members: ValueGenerator<T>[]
): ValueGenerator<T> {
  return function* () {
    for (const v of members) {
      yield* v();
    }
  };
}

export function array<T>(
  value: ValueGenerator<T>
): ValueGenerator<T[]> {
  return function* () {
    for (const v of value()) {
      yield [v];
    }
  };
}

export function object<T>(
  obj: Record<string, ValueGenerator<T>>
): ValueGenerator<T> {
  return () => rollObject(obj) as Generator<T>;
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
  obj: Record<string, ValueGenerator<T>>
): Generator<Record<string, T>> {
  const keys = Object.keys(obj);
  if (keys.length == 0) {
    yield {};
    return;
  }

  const [key, ...restKeys] = keys;
  assert(key, "at least one property must be present at this point");

  const value = obj[key];
  assert(value);

  const restObj = pick(obj, restKeys);

  for (const v of value()) {
    for (const rest of rollObject(restObj)) {
      yield {
        [key]: v,
        ...rest,
      };
    }
  }
}

export type Value =
  | number
  | string
  | null
  | undefined
  | boolean
  | { [key: string]: Value }
  | Value[];

export function combine(fn: ValueGenerator<unknown>) {
  return [...fn()];
}
