import ts, { factory } from "typescript";
import { invalidValue, Reference, type Value } from "./combinator";
import { unreachable } from "./helpers";
import {
  invalidValueVarName,
  invalidVarNameFromType,
  validVarNameFromType,
} from "./tester";

export function valueToNode(value: Value): ts.Expression {
  // built-ins
  if (typeof value === "number") {
    return factory.createNumericLiteral(value);
  } else if (typeof value === "string") {
    return factory.createStringLiteral(value);
  } else if (typeof value === "boolean") {
    return value ? factory.createTrue() : factory.createFalse();
  } else if (typeof value === "undefined") {
    // historically an identifier while having been
    // a built-in sorta constant for ages
    return factory.createIdentifier("undefined");
  } else if (value === null) {
    // historically an identifier while having been
    // a built-in sorta constant for ages
    return factory.createNull();
  } else if (Array.isArray(value)) {
    return factory.createArrayLiteralExpression(
      value.map(valueToNode)
    );
  }

  if (value instanceof Reference) {
    const varName = value.isValid
      ? validVarNameFromType(value.typeName)
      : invalidVarNameFromType(value.typeName);

    return factory.createElementAccessExpression(
      factory.createIdentifier(varName),
      factory.createNumericLiteral("0")
    );
  }

  if (value === invalidValue) {
    return factory.createIdentifier(invalidValueVarName);
  }

  // catch-all object
  if (typeof value === "object") {
    return factory.createObjectLiteralExpression(
      Object.entries(value).map(([k, v]) =>
        factory.createPropertyAssignment(
          factory.createIdentifier(k),
          valueToNode(v)
        )
      )
    );
  }

  value satisfies never;
  unreachable(`value ${value} is not supported`);
}
