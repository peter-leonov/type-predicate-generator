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

export type ValueGenerator<T> = (ctx: Context) => Generator<T>;

type Context = {
  yieldInvalidValue: boolean;
  state: Map<string, number>;
};

let valueCounter = 0;
function uniqueID(): string {
  return String(++valueCounter);
}

export function value<T>(value: T): ValueGenerator<T> {
  const id = uniqueID();
  return function* (ctx: Context) {
    if (ctx.yieldInvalidValue) {
      if (!ctx.state.has(id)) {
        // Time to yield some invalid data
        ctx.state.set(id, 1);
        ctx.yieldInvalidValue = false;
        yield invalidValue;
      }
    }
    yield value;
  };
}

export function union<T>(
  members: ValueGenerator<T>[]
): ValueGenerator<T> {
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
    if (ctx.yieldInvalidValue) {
      if (!ctx.state.has(id)) {
        // Time to yield some invalid data
        ctx.state.set(id, 1);
        ctx.yieldInvalidValue = false;
        yield invalidValue;
      }
    }
    for (const v of value(ctx)) {
      yield [v];
    }
  };
}

export function object<T>(
  obj: Record<string, ValueGenerator<T>>
): ValueGenerator<T> {
  const id = uniqueID();
  return function* (ctx: Context) {
    if (ctx.yieldInvalidValue) {
      const stateKey = `${id}_root`;
      if (!ctx.state.has(stateKey)) {
        // Time to yield some invalid data
        ctx.state.set(stateKey, 1);
        ctx.yieldInvalidValue = false;
        yield invalidValue;
      }
    }
    yield* rollObject(ctx, id, obj) as Generator<T>;
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

// TODO
// const uniqueKey = "80D79A5A-5D38-4302-BA04-F5AC748C1464";
// yield { [uniqueKey]: invalidValue };

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

  const restObj = pick(obj, restKeys);

  if (ctx.yieldInvalidValue) {
    const stateKey = `${id}_key_${key}`;
    if (!ctx.state.has(stateKey)) {
      // Time to yield some invalid data
      ctx.state.set(stateKey, 1);
      ctx.yieldInvalidValue = false;
      for (const rest of rollObject(ctx, id, restObj)) {
        yield {
          // TODO skip for optional keys
          // Omit the current key and value
          ...rest,
        };
      }
    }
  }

  const value = obj[key];
  assert(value);

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
    yieldInvalidValue: false,
    state: new Map(),
  };
  return [...fn(ctx)];
}

export function combineInvalid(fn: ValueGenerator<Value>) {
  const ctx: Context = {
    yieldInvalidValue: false,
    state: new Map(),
  };

  const g = fn(ctx);

  const res: Value[] = [];

  for (;;) {
    // Reset the flag for the current step of the state machine.
    ctx.yieldInvalidValue = true;
    const ir = g.next();
    if (ir.done) {
      break;
    }

    if (!ctx.yieldInvalidValue) {
      // Storing one more broken value.
      res.push(ir.value);
    } else {
      // Ignoring valid ones
    }
  }

  return res;
}
