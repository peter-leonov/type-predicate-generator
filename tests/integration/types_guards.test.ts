import { expect, describe, it } from "vitest";
import { isUser } from "./types_guards";
const invalidValue: any = Symbol("invalidValue");
const valid_User = [
    { "id": 0, "login": "string", "bio": { "first": "string", "last": "string" } },
    { "id": 42, "login": "string", "bio": { "first": "string", "last": "string" } }
];
const invalid_User = [
    invalidValue,
    { "login": "string", "bio": { "first": "string", "last": "string" } },
    { "id": invalidValue, "login": "string", "bio": { "first": "string", "last": "string" } },
    { "id": 0, "bio": { "first": "string", "last": "string" } },
    { "id": 0, "login": invalidValue, "bio": { "first": "string", "last": "string" } },
    { "id": 0, "login": "string" },
    { "id": 0, "login": "string", "bio": invalidValue },
    { "id": 0, "login": "string", "bio": { "last": "string" } },
    { "id": 0, "login": "string", "bio": { "first": invalidValue, "last": "string" } },
    { "id": 0, "login": "string", "bio": { "first": "string" } },
    { "id": 0, "login": "string", "bio": { "first": "string", "last": invalidValue } },
    { "id": 42, "bio": { "first": "string", "last": "string" } },
    { "id": 42, "login": invalidValue, "bio": { "first": "string", "last": "string" } },
    { "id": 42, "login": "string" },
    { "id": 42, "login": "string", "bio": invalidValue },
    { "id": 42, "login": "string", "bio": { "last": "string" } },
    { "id": 42, "login": "string", "bio": { "first": invalidValue, "last": "string" } },
    { "id": 42, "login": "string", "bio": { "first": "string" } },
    { "id": 42, "login": "string", "bio": { "first": "string", "last": invalidValue } }
];
describe("User", () => {
    it.for(valid_User)("valid", value => {
        expect(isUser(value)).toBe(true);
    });
    it.for(invalid_User)("invalid", value => {
        expect(isUser(value)).toBe(false);
    });
});
