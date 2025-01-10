import { type User } from "./types";
type SafeShallowShape<Type> = {
    [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isUser(root: unknown): root is User {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    (root) satisfies {};
    const { id, login, bio }: SafeShallowShape<User> = root;
    if (!(typeof id === "number")) {
        return false;
    }
    if (!(typeof login === "string")) {
        return false;
    }
    if (!(typeof bio === "object" && bio !== null)) {
        return false;
    }
    (bio) satisfies {};
    const { first, last }: SafeShallowShape<User["bio"]> = bio;
    if (!(typeof first === "string")) {
        return false;
    }
    if (!(typeof last === "string")) {
        return false;
    }
    ({
        id,
        login,
        bio: {
            first,
            last
        }
    }) satisfies User;
    return true;
}
