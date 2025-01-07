import { assert } from "./helpers";

type GenFn<T> = () => Generator<T>;

function value<T>(value: T): GenFn<T> {
  return function* () {
    yield value;
  };
}

function union<T>(members: GenFn<T>[]): GenFn<T> {
  return function* () {
    for (const v of members) {
      yield* v();
    }
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

function* object<T>(
  obj: Record<string, GenFn<T>>
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
    for (const rest of object(restObj)) {
      yield {
        [key]: v,
        ...rest,
      };
    }
  }
}

const obj: Record<string, GenFn<unknown>> = {
  a: union([value(1), value(2)]),
  b: union([value(true), value(false)]),
  c: union([value("a"), value("b")]),
  d: () =>
    object({
      d2: union([value(null), value(undefined)]),
    }),
};

export function combine() {
  return [...object(obj)];
}

// export function combine(fn: GenFn<unknown>) {
//   return [...fn()];
// }
