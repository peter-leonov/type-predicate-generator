import { type User, type Post } from "./example.ts";
type SafeShallowShape<Type> = {
    [_ in keyof Type]?: unknown;
};
function ensureType<T>(_: T) { }
export function isUser(root: unknown): root is User {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
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
    const { first, last }: SafeShallowShape<User["bio"]> = bio;
    if (!(typeof first === "string")) {
        return false;
    }
    if (!(typeof last === "string")) {
        return false;
    }
    ensureType<User>({
        id,
        login,
        bio: {
            first,
            last
        }
    });
    return true;
}
export function isPost(root: unknown): root is Post {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    const { title, text, link, published, author }: SafeShallowShape<Post> = root;
    if (!(typeof title === "string")) {
        return false;
    }
    if (!(typeof text === "string")) {
        return false;
    }
    if (!((link === undefined) || (typeof link === "string"))) {
        return false;
    }
    if (!(typeof published === "boolean")) {
        return false;
    }
    if (!(isUser(author))) {
        return false;
    }
    ensureType<Post>({
        title,
        text,
        link,
        published,
        author
    });
    return true;
}

