import { type User } from "./example";
type SafeShallowShape<Type extends {}> = {
  [_ in keyof Type]?: unknown;
};
export function isUser(root: unknown): root is User {
  type ObjectInAddress = Extract<User["address"], object>;
  function isObjectInAddress(root: unknown): root is ObjectInAddress {
    if (!(typeof root === "object" && root !== null)) {
      return false;
    }
    root satisfies {};
    const { street, house }: SafeShallowShape<ObjectInAddress> = root;
    // check that `root.street` is of primitive type `string`
    if (!(typeof street === "string")) {
      return false;
    }
    // check that `root.house` is of primitive type `number`
    if (!(typeof house === "number")) {
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
    street satisfies never;
    // @ts-expect-error: should not be `never`
    house satisfies never;
    ({
      street,
      house,
    }) satisfies ObjectInAddress;
    return true;
  }
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { id, login, email, address }: SafeShallowShape<User> = root;
  // check that `root.id` is of primitive type `number`
  if (!(typeof id === "number")) {
    return false;
  }
  // check that `root.login` is of primitive type `string`
  if (!(typeof login === "string")) {
    return false;
  }
  // check that `root.email` is in the union of 2 trivial types
  if (!(typeof email === "undefined" || typeof email === "string")) {
    return false;
  }
  // check that `root.address` is of nested type ObjectInAddress
  if (!(typeof address === "undefined" || isObjectInAddress(address))) {
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
  isUser satisfies never;
  // @ts-expect-error: should not be `never`
  id satisfies never;
  // @ts-expect-error: should not be `never`
  login satisfies never;
  // @ts-expect-error: should not be `never`
  email satisfies never;
  // @ts-expect-error: should not be `never`
  address satisfies never;
  // @ts-expect-error: should not be `never`
  isObjectInAddress satisfies never;
  ({
    id,
    login,
    email,
    address,
  }) satisfies User;
  return true;
}
