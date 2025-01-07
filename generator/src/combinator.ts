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
 */
const invalidValue = Symbol("invalidValue");

export type Value =
  | number
  | string
  | null
  | undefined
  | boolean
  | { [key: string]: Value }
  | Value[];

export type ValueGenerator<T> = (ctx: Context) => Generator<T>;

type Context = {
  invalidOnce: boolean;
  state: Map<string, number>;
};

let valueCounter = 0;
function uniqueID(): string {
  return String(++valueCounter);
}

export function value<T>(value: T): ValueGenerator<T> {
  const id = uniqueID();
  return function* (ctx: Context) {
    if (ctx.invalidOnce) {
      if (!ctx.state.has(id)) {
        // Time to yield some invalid data
        ctx.state.set(id, 1);
        ctx.invalidOnce = false;
        yield invalidValue as T;
      }
    }
    yield value;
  };
}

export function union<T>(
  members: ValueGenerator<T>[]
): ValueGenerator<T> {
  const id = uniqueID();
  return function* (ctx: Context) {
    for (const v of members) {
      yield* v(ctx);
    }
  };
}

export function array<T>(
  value: ValueGenerator<T>
): ValueGenerator<T[]> {
  const id = uniqueID();
  return function* (ctx: Context) {
    for (const v of value(ctx)) {
      yield [v];
    }
  };
}

export function object<T>(
  obj: Record<string, ValueGenerator<T>>
): ValueGenerator<T> {
  const id = uniqueID();
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
  id: string,
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

export function combineValid(fn: ValueGenerator<Value>) {
  const ctx: Context = {
    invalidOnce: false,
    state: new Map(),
  };
  return [...fn(ctx)];
}

export function combineInvalid(fn: ValueGenerator<Value>) {
  const ctx: Context = {
    invalidOnce: false,
    state: new Map(),
  };

  const g = fn(ctx);

  const res: Value[] = [];

  for (;;) {
    // Reset the flag for the current step of the state machine.
    ctx.invalidOnce = true;
    const ir = g.next();
    if (ir.done) {
      break;
    }
    // All the values have produce invalid values in their turn enough times,
    // thus none has this time, we're done.
    if (ctx.invalidOnce) {
      break;
    }
    // Storing one more broken value.
    res.push(ir.value);
  }

  return res;
}
