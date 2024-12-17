import ts from "typescript";
import { factory } from "typescript";
import { AttributeLocal, type Path, Scope } from "./scope.mts";
import {
  LiteralType,
  ObjectType,
  PrimitiveType,
  type TypeModel,
} from "./model.mts";
import { ok } from "node:assert";
import { unimplemented } from "./helpers.mts";

export class TypeGuardGenerator {
  guards: ts.Statement[];
  constructor() {
    this.guards = [];
  }

  getAssertionsForLocalVar(
    scope: Scope,
    path: Path,
    target: AttributeLocal,
    typePath: string[],
    type: TypeModel
  ): ts.Statement[] {
    const targetPath = [...path, target.attribute_name];

    // for the non-root type
    if (path.length >= 1) {
      const { aliasName } = type.options;
      if (aliasName) {
        return assertNamedType(target.local_name, aliasName);
      }
    }

    if (type instanceof ObjectType) {
      const entries = Object.entries(type.attributes).map(
        ([attr, type]) =>
          [scope.createAttribute(targetPath, attr), type] as const
      );
      const attrs = entries.map(([local, _]) => local);
      return [
        ...assertIsObject(target.local_name),
        ...objectSpread(
          target.local_name,
          attrs,
          typePathToTypeSelector(typePath)
        ),
        ...entries.flatMap(([local, type]) => {
          return this.getAssertionsForLocalVar(
            scope,
            targetPath,
            local,
            [...typePath, local.attribute_name],
            type
          );
        }),
      ];
    } else if (type instanceof PrimitiveType) {
      return [
        ...assertPrimitiveType(target.local_name, type.primitive),
      ];
    } else if (type instanceof LiteralType) {
      return [
        ...assertPrimitiveType(target.local_name, "type.primitive"),
      ];
    }

    unimplemented(`${type}`);
  }

  /**
   * It's a method because it's suppored to call itself for referenced types.
   */
  addTypeGuardFor(type: TypeModel): void {
    const typeName = type.options.aliasName;
    ok(typeName);

    const root = "root";
    const scope = new Scope();
    const rootLocal = scope.createAttribute([], root);

    const guard = predicateFunction(root, `is${typeName}`, typeName, [
      ...this.getAssertionsForLocalVar(
        scope,
        [],
        rootLocal,
        [typeName],
        type
      ),
      // ...assertAreNotNever(scope.list()),
      ...typeSafeCheckAssembly(scope, root, [root], typeName, type),
    ]);

    this.guards.push(guard);
  }

  getGuards(): ts.Statement[] {
    return this.guards;
  }
}

function assertIsObject(target: string): ts.Statement[] {
  return [
    factory.createIfStatement(
      factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        factory.createParenthesizedExpression(
          factory.createBinaryExpression(
            factory.createBinaryExpression(
              factory.createTypeOfExpression(
                factory.createIdentifier(target)
              ),
              factory.createToken(
                ts.SyntaxKind.EqualsEqualsEqualsToken
              ),
              factory.createStringLiteral("object")
            ),
            factory.createToken(
              ts.SyntaxKind.AmpersandAmpersandToken
            ),
            factory.createBinaryExpression(
              factory.createIdentifier(target),
              factory.createToken(
                ts.SyntaxKind.ExclamationEqualsEqualsToken
              ),
              factory.createNull()
            )
          )
        )
      ),
      factory.createBlock(
        [factory.createReturnStatement(factory.createFalse())],
        true
      ),
      undefined
    ),
  ];
}

const SafeShallowShape = "SafeShallowShape";

function objectSpread(
  target: string,
  properties: AttributeLocal[],
  type: string
): ts.Statement[] {
  ok(properties.length != 0);
  return [
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            factory.createObjectBindingPattern(
              properties.map((id) =>
                factory.createBindingElement(
                  undefined,
                  id.isShorthand()
                    ? undefined
                    : JSON.stringify(id.attribute_name),
                  id.local_name,
                  undefined
                )
              )
            ),
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier(SafeShallowShape),
              [
                factory.createTypeReferenceNode(
                  factory.createIdentifier(type),
                  undefined
                ),
              ]
            ),
            factory.createIdentifier(target)
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
  ];
}

function assertPrimitiveType(
  target: string,
  type: string
): ts.Statement[] {
  return [
    factory.createIfStatement(
      factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        factory.createParenthesizedExpression(
          factory.createBinaryExpression(
            factory.createTypeOfExpression(
              factory.createIdentifier(target)
            ),
            factory.createToken(
              ts.SyntaxKind.EqualsEqualsEqualsToken
            ),
            factory.createStringLiteral(type)
          )
        )
      ),
      factory.createBlock(
        [factory.createReturnStatement(factory.createFalse())],
        true
      ),
      undefined
    ),
  ];
}

function typePathToTypeSelector(path: string[]): string {
  const [root, ...rest] = path;
  return `${root}${rest.map((attr) => `[${JSON.stringify(attr)}]`)}`;
}

function typeSafeCheckObject(
  scope: Scope,
  path: Path,
  type: ObjectType
): ts.Expression {
  const attributes = Object.entries(type.attributes).map(
    ([attr, type]) => {
      const local = scope.getByPath(path, attr);
      const { aliasName } = type.options;
      if (!aliasName) {
        if (type instanceof ObjectType) {
          return factory.createPropertyAssignment(
            factory.createIdentifier(local.local_name),
            typeSafeCheckObject(scope, [...path, attr], type)
          );
        }
      }

      if (local.isShorthand()) {
        return factory.createShorthandPropertyAssignment(
          factory.createIdentifier(local.local_name),
          undefined
        );
      } else {
        return factory.createPropertyAssignment(
          JSON.stringify(local.attribute_name),
          factory.createIdentifier(local.local_name)
        );
      }
    }
  );

  return factory.createObjectLiteralExpression(attributes, true);
}

function typeSafeCheckAssembly(
  scope: Scope,
  target: string,
  path: Path,
  typeName: string,
  type: TypeModel
): ts.Statement[] {
  const _root_type_assertion = scope.createAttribute(
    [],
    "_root_type_assertion"
  );

  let initializer: ts.Expression;

  if (type instanceof ObjectType) {
    initializer = typeSafeCheckObject(scope, path, type);
  } else {
    initializer = factory.createIdentifier(target);
  }

  return [
    factory.createVariableStatement(
      undefined,
      factory.createVariableDeclarationList(
        [
          factory.createVariableDeclaration(
            _root_type_assertion.local_name,
            undefined,
            factory.createTypeReferenceNode(
              factory.createIdentifier(typeName),
              undefined
            ),
            initializer
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
  ];
}

const is_never = "is_never";

function assertIsNotNever(target: string): ts.Statement {
  const targetID = factory.createIdentifier(target);
  ts.addSyntheticLeadingComment(
    targetID,
    ts.SyntaxKind.SingleLineCommentTrivia,
    " @ts-expect-error: should not be `never`",
    true
  );
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createIdentifier(is_never),
      undefined,
      [targetID]
    )
  );
}

function assertAreNotNever(targets: string[]): ts.Statement[] {
  return targets.map(assertIsNotNever);
}

function predicateFunction(
  argument: string,
  name: string,
  returnType: string,
  body: ts.Statement[]
): ts.Statement {
  // createTempVariable

  return factory.createFunctionDeclaration(
    undefined,
    undefined,
    factory.createIdentifier(name),
    undefined,
    [
      factory.createParameterDeclaration(
        undefined,
        undefined,
        factory.createIdentifier(argument),
        undefined,
        factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
        undefined
      ),
    ],
    factory.createTypePredicateNode(
      undefined,
      factory.createIdentifier(argument),
      factory.createTypeReferenceNode(
        factory.createIdentifier(returnType),
        undefined
      )
    ),
    factory.createBlock(body, true)
  );
}

function assertNamedType(
  target: string,
  type: string
): ts.Statement[] {
  return [
    factory.createIfStatement(
      factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        factory.createCallExpression(
          factory.createIdentifier(`is${type}`),
          undefined,
          [factory.createIdentifier(target)]
        )
      ),
      factory.createBlock(
        [factory.createReturnStatement(factory.createFalse())],
        false
      ),
      undefined
    ),
  ];
}
