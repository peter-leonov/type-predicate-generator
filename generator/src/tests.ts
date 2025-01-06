import { assert } from "./helpers";

function* typeA() {
  yield 1;
  yield 2;
}

function* typeB() {
  yield true;
  yield false;
}

function* typeC() {
  yield "a";
  yield "b";
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

type GenFn<T> = () => Generator<T>;

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
  a: typeA,
  b: typeB,
  c: typeC,
};

export function combine() {
  return [...object(obj)];
}
