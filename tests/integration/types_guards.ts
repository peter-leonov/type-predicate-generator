import { type ExternalType, type User, type Post } from "./types";
type SafeShallowShape<Type> = {
    [_ in keyof Type]?: unknown;
};
const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
export function isExternalType(root: unknown): root is ExternalType {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    (root) satisfies {};
    const { id, body }: SafeShallowShape<ExternalType> = root;
    if (!(typeof id === "string")) {
        return false;
    }
    if (!(typeof body === "string")) {
        return false;
    }
    ({
        id,
        body
    }) satisfies ExternalType;
    return true;
}
export function isUser(root: unknown): root is User {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    (root) satisfies {};
    const { id, login, bio, external }: SafeShallowShape<User> = root;
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
    if (!(isExternalType(external))) {
        return false;
    }
    ({
        id,
        login,
        bio: {
            first,
            last
        },
        external
    }) satisfies User;
    return true;
}
export function isPost(root: unknown): root is Post {
    type Element = Post["more"][number];
    function isElement(root: unknown): root is Element {
        if (!((typeof root === "string") || (typeof root === "number"))) {
            return false;
        }
        (root) satisfies Element;
        return true;
    }
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    (root) satisfies {};
    const { title, text, link, published, author, more }: SafeShallowShape<Post> = root;
    if (!(typeof title === "string")) {
        return false;
    }
    if (!(typeof text === "string")) {
        return false;
    }
    if (!((typeof link === "undefined") || (typeof link === "string"))) {
        return false;
    }
    if (!(typeof published === "boolean")) {
        return false;
    }
    if (!(isUser(author))) {
        return false;
    }
    if (!(safeIsArray(more) && more.every(isElement))) {
        return false;
    }
    ({
        title,
        text,
        link,
        published,
        author,
        more
    }) satisfies Post;
    return true;
}
