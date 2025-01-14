import { type User } from "./example";
type SafeShallowShape<Type> = {
  [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isUser(root: unknown): root is User {
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
  if (!(typeof address === "object" && address !== null)) {
    return false;
  }
  address satisfies {};
  const { street, house }: SafeShallowShape<User["address"]> = address;
  if (!(typeof street === "string")) {
    return false;
  }
  if (!(typeof house === "number")) {
    return false;
  }
  ({
    id,
    login,
    email,
    address: {
      street,
      house,
    },
  }) satisfies User;
  return true;
}
