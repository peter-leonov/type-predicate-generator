import { type User } from "./example";
type SafeShallowShape<Type extends {}> = {
  [_ in keyof Type]?: unknown;
};
export function isUser(root: unknown): root is User {
  type Address = Extract<User["address"], object>;
  function isAddress(root: unknown): root is Address {
    if (!(typeof root === "object" && root !== null)) {
      return false;
    }
    root satisfies {};
    const { street, house }: SafeShallowShape<Address> = root;
    if (!(typeof street === "string")) {
      return false;
    }
    if (!(typeof house === "number")) {
      return false;
    }
    ({
      street,
      house,
    }) satisfies Address;
    return true;
  }
  if (!(typeof root === "object" && root !== null)) {
    return false;
  }
  root satisfies {};
  const { id, login, email, address }: SafeShallowShape<User> = root;
  if (!(typeof id === "number")) {
    return false;
  }
  if (!(typeof login === "string")) {
    return false;
  }
  if (!(typeof email === "undefined" || typeof email === "string")) {
    return false;
  }
  if (!(typeof address === "undefined" || isAddress(address))) {
    return false;
  }
  ({
    id,
    login,
    email,
    address,
  }) satisfies User;
  return true;
}
