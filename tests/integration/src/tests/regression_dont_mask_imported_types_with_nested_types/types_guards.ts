import { type X, type ObjectInY } from "./types";
// used to safely get all the object attributes as `unknown`s
type SafeShallowShape<Type extends object> = {
  [_ in keyof Type]?: unknown;
};
export function isX(root: unknown): root is X {
  type X_ObjectInY = Extract<X["Y"], object>;
  function isX_ObjectInY(root: unknown): root is X_ObjectInY {
    // check that `root` is an object
    if (!(typeof root === "object" && root !== null)) {
      return false;
    }
    root satisfies object;
    // safely get all the attributes from `root` as `unknown`s
    const { a }: SafeShallowShape<X_ObjectInY> = root;
    // check that `root.a` is of type ObjectInY
    if (!isObjectInY(a)) {
      return false;
    }
    /*
          In TypeScript the `never` type is assignable to any other type,
          effectively turning it into an unsafe `any` type at assignment.
          The following checks ensure that none of the checked values got
          narrowed down to `never`.
        */
    // @ts-expect-error: should not be `never`
    root satisfies never;
    // @ts-expect-error: should not be `never`
    a satisfies never;
    /*
          Verify that all the predicates above narrowed all the types
          down to the root type that is being checked by the predicate.
          This is the key check that makes the whole type predicate safe.
        */
    ({
      a,
    }) satisfies X_ObjectInY;
    return true;
  }
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies object;
  // safely get all the attributes from `root` as `unknown`s
  const { Y }: SafeShallowShape<X> = root;
  // check that `root.Y` is of nested type X_ObjectInY
  if (!(typeof Y === "undefined" || isX_ObjectInY(Y))) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  isX satisfies never;
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  Y satisfies never;
  // @ts-expect-error: should not be `never`
  isX_ObjectInY satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
  ({
    Y,
  }) satisfies X;
  return true;
}
export function isObjectInY(root: unknown): root is ObjectInY {
  // check that `root` is an object
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies object;
  // safely get all the attributes from `root` as `unknown`s
  const { b }: SafeShallowShape<ObjectInY> = root;
  // check that `root.b` is of primitive type `string`
  if (!(typeof b === "string")) {
    return false;
  }
  /*
      In TypeScript the `never` type is assignable to any other type,
      effectively turning it into an unsafe `any` type at assignment.
      The following checks ensure that none of the checked values got
      narrowed down to `never`.
    */
  // @ts-expect-error: should not be `never`
  isObjectInY satisfies never;
  // @ts-expect-error: should not be `never`
  root satisfies never;
  // @ts-expect-error: should not be `never`
  b satisfies never;
  /*
      Verify that all the predicates above narrowed all the types
      down to the root type that is being checked by the predicate.
      This is the key check that makes the whole type predicate safe.
    */
  ({
    b,
  }) satisfies ObjectInY;
  return true;
}
