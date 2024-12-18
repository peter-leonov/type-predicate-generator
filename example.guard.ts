import { type Car, type MyUser } from "./example.ts";
type SafeShallowShape<Type> = {
    [_ in keyof Type]?: unknown;
};
export function isCar(root: unknown): root is Car {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    const { brand }: SafeShallowShape<Car> = root;
    if (!(typeof brand === "string")) {
        return false;
    }
    const _root_type_assertion: Car = {
        brand
    };
    return true;
}
export function isMyUser(root: unknown): root is MyUser {
    if (!(typeof root === "object" && root !== null)) {
        return false;
    }
    const { optional, nested, name, age, car }: SafeShallowShape<MyUser> = root;
    if (!((optional === undefined) || (typeof optional === "number"))) {
        return false;
    }
    if (!(typeof nested === "object" && nested !== null)) {
        return false;
    }
    const { foo }: SafeShallowShape<MyUser["nested"]> = nested;
    if (!(typeof foo === "string")) {
        return false;
    }
    if (!(typeof name === "string")) {
        return false;
    }
    if (!(typeof age === "number")) {
        return false;
    }
    if (!(isCar(car))) {
        return false;
    }
    const _root_type_assertion: MyUser = {
        optional,
        nested: {
            foo
        },
        name,
        age,
        car
    };
    return true;
}

