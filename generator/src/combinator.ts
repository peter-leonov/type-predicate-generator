import { assert } from "./helpers";

export type ValueGenerator<T> = (ctx: Context) => Generator<T>;

type Context = {
  doBreak: boolean;
  brokeOnce: boolean;
  state: Map<string, boolean>;
};

let valueCounter = 0;

export function value<T>(value: T): ValueGenerator<T> {
  const id = ++valueCounter;
  return function* () {
    yield value;
  };
}

export function union<T>(
  members: ValueGenerator<T>[]
): ValueGenerator<T> {
  const id = ++valueCounter;
  return function* (ctx: Context) {
    for (const v of members) {
      yield* v(ctx);
    }
  };
}

export function array<T>(
  value: ValueGenerator<T>
): ValueGenerator<T[]> {
  const id = ++valueCounter;
  return function* (ctx: Context) {
    for (const v of value(ctx)) {
      yield [v];
    }
  };
}

export function object<T>(
  obj: Record<string, ValueGenerator<T>>
): ValueGenerator<T> {
  const id = ++valueCounter;
  return (ctx: Context) => rollObject(ctx, id, obj) as Generator<T>;
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
  ctx: Context,
  id: number,
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

  for (const v of value(ctx)) {
    for (const rest of rollObject(ctx, id, restObj)) {
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

export function combineValid(fn: ValueGenerator<unknown>) {
  const ctx: Context = {
    doBreak: false,
    brokeOnce: false,
    state: new Map(),
  };
  return [...fn(ctx)];
}
