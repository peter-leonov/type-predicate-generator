import ts from "typescript";
import { factory } from "typescript";
import { AttributeLocal, type Path, Scope, TypeScope } from "./scope";
import {
  ArrayType,
  LiteralType,
  ObjectType,
  PrimitiveType,
  AliasType,
  UnionType,
  type TypeModel,
} from "./model.js";
import { assert, unimplemented } from "./helpers";
import {
  MissingExportedType,
  UnsupportedUnionMember as UnsupportedUnion,
} from "./errors";

/**
 * This class transforms and combines several `TypeModel`s
 * into a coherent set of type predicates in form of AST Nodes.
 *
 * All the meat is in this class of a handful of methods.
 * The rest of the module and the project is just supporting
 * the code here.
 */
export class TypeGuardGenerator {
  guards: Map<string, ts.Statement>;
  referencedTypes: {
    referencedTypeName: string;
    referencedFrom: string;
  }[];
  needsSafeShallowShape: boolean;
  needsSafeIsArray: boolean;
  /**
   * Some context that is cumbersome to pass as arguments.
   */
  ctx: { rootTypeName?: string };
  /**
   * File global type scope.
   */
  typeScope: TypeScope;

  constructor() {
    this.needsSafeShallowShape = false;
    this.needsSafeIsArray = false;
    this.typeScope = new TypeScope();
    this.guards = new Map();
    this.referencedTypes = [];
    this.ctx = {};
  }

  getAssertionsForLocalVar(
    scope: Scope,
    path: Path,
    target: AttributeLocal,
    typePath: string[],
    type: TypeModel
  ): { hoist: ts.Statement[]; body: ts.Statement[] } {
    const targetPath = [...path, target.attribute_name];

    if (type instanceof AliasType) {
      return {
        hoist: [],
        body: ifNotReturnFalse(
          this.assertionConditionForType(target.local_name, type)
        ),
      };
    } else if (type instanceof ArrayType) {
      this.needsSafeIsArray = true;
      const nestedTypeName = this.typeScope.newTypeName(
        typePath.map(capitalize),
        "Element"
      );
      const guardName = scope.newLocalName([], `is${nestedTypeName}`);
      return {
        hoist: [
          typeAliasForArrayElement(nestedTypeName, typePath),
          this.createTypeGuardFor(
            guardName,
            nestedTypeName,
            type.element
          ),
        ],
        body: ifNotReturnFalse(
          assertionConditionForArrayType(target.local_name, guardName)
        ),
      };
    } else if (type instanceof ObjectType) {
      const entries = Object.entries(type.attributes).map(
        ([attr, type]) =>
          [scope.createAttribute(targetPath, attr), type] as const
      );
      // Only require SafeShallowShape for non-empty objects
      if (entries.length) {
        this.needsSafeShallowShape = true;
      }

      const attrs = entries.map(([local, _]) => local);
      const hoists: ts.Statement[] = [];
      const bodies: ts.Statement[] = [
        ...assertIsObject(target.local_name),
        ...objectSpread(
          target.local_name,
          attrs,
          typePathToTypeSelector(typePath)
        ),
      ];

      entries.forEach(([local, type]) => {
        const { hoist, body } = this.getAssertionsForLocalVar(
          scope,
          targetPath,
          local,
          [...typePath, local.attribute_name],
          type
        );
        hoists.push(...hoist);
        bodies.push(...body);
      });

      return {
        hoist: hoists,
        body: bodies,
      };
    } else if (type instanceof PrimitiveType) {
      return {
        hoist: [],
        body: ifNotReturnFalse(
          this.assertionConditionForType(target.local_name, type)
        ),
      };
    } else if (type instanceof LiteralType) {
      return {
        hoist: [],
        body: ifNotReturnFalse(
          this.assertionConditionForType(target.local_name, type)
        ),
      };
    } else if (type instanceof UnionType) {
      const unsafeUnionTypes = type.types.filter(
        (t) => !safeToUseInAUnion(t)
      );
      if (unsafeUnionTypes.length > 0) {
        if (unsafeUnionTypes.length > 1) {
          throw new UnsupportedUnion(unsafeUnionTypes);
        }

        const unsafeType = unsafeUnionTypes[0];
        assert(
          unsafeType,
          "expect at least one element to be present"
        );
        if (unsafeType instanceof ObjectType) {
          const nestedTypeName = this.typeScope.newTypeName(
            ...getObjectTypeName(typePath)
          );
          const safeUnionTypes = type.types.filter((t) =>
            safeToUseInAUnion(t)
          );
          const referenceType = new AliasType(
            {},
            nestedTypeName,
            true
          );
          const guardName = scope.newLocalName(
            [],
            `is${nestedTypeName}`
          );
          return {
            hoist: [
              typeAliasForObjectAttribute(nestedTypeName, typePath),
              this.createTypeGuardFor(
                guardName,
                nestedTypeName,
                unsafeType
              ),
            ],
            body: ifNotReturnFalse(
              // assertionConditionForArrayType(target.local_name, guardName)
              this.assertionConditionForUnionTypes(
                target.local_name,
                [...safeUnionTypes, referenceType]
              )
            ),
          };
        } else {
          throw new UnsupportedUnion(unsafeUnionTypes);
        }
      }

      return {
        hoist: [],
        body: ifNotReturnFalse(
          this.assertionConditionForUnionTypes(
            target.local_name,
            type.types
          )
        ),
      };
    }

    [type] satisfies [never];
    unimplemented(`${(type as Object)?.constructor.name}`);
  }

  assertionConditionForType(
    target: string,
    type: TypeModel
  ): ts.Expression {
    if (type instanceof AliasType) {
      // Don't require a top level predicate generated for a nested
      // predicate type.
      if (!type.forNestedPredicate) {
        const rootTypeName = this.ctx.rootTypeName;
        assert(rootTypeName, "the root type name is always known");
        this.referencedTypes.push({
          referencedFrom: rootTypeName,
          referencedTypeName: type.name,
        });
      }
      return factory.createCallExpression(
        factory.createIdentifier(`is${type.name}`),
        undefined,
        [factory.createIdentifier(target)]
      );
    }

    if (type instanceof PrimitiveType) {
      return factory.createBinaryExpression(
        factory.createTypeOfExpression(
          factory.createIdentifier(target)
        ),
        factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
        factory.createStringLiteral(type.primitive)
      );
    }

    if (type instanceof LiteralType) {
      if (type.value === undefined) {
        return factory.createBinaryExpression(
          factory.createTypeOfExpression(
            factory.createIdentifier(target)
          ),
          factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
          factory.createStringLiteral("undefined")
        );
      }
      return factory.createBinaryExpression(
        factory.createIdentifier(target),
        factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
        valueToNode(type.value)
      );
    }

    if (type instanceof UnionType) {
      return this.assertionConditionForUnionTypes(target, type.types);
    }

    assert(
      !(type instanceof ObjectType),
      `${type.constructor.name} is invalid here`
    );

    assert(
      !(type instanceof ArrayType),
      `${type.constructor.name} is invalid here`
    );

    [type] satisfies [never];
    unimplemented(`${(type as Object)?.constructor.name}`);
  }

  assertionConditionForUnionTypes(
    target: string,
    types: TypeModel[]
  ): ts.Expression {
    // A union is a set of at least two types.
    assert(types.length >= 2);
    // Nested unions look like an error and are not supported.
    assert(!types.some((t) => t instanceof UnionType));
    return wrapListInOr(
      types.map((t) => this.assertionConditionForType(target, t))
    );
  }

  /**
   * It's a method because it's suppored to call itself for referenced types.
   */
  addRootTypeGuardFor(type: TypeModel): void {
    this.ctx = {};
    const typeName = type.options.aliasName;
    this.ctx.rootTypeName = typeName;
    assert(typeName, "the root type must have an alias name");

    const root = "root";
    const scope = new Scope();
    const rootLocal = scope.createAttribute([], root);

    const predicateName = scope.newLocalName([], `is${typeName}`);

    const { hoist, body } = this.getAssertionsForLocalVar(
      scope,
      [],
      rootLocal,
      [typeName],
      type
    );

    const guard = predicateFunction(
      root,
      predicateName,
      typeName,
      [
        // hoist to the top what's returned as hoist
        ...hoist,
        // then follow with the body statements
        ...body,
        // ...assertAreNotNever(scope.list()),
        ...typeSafeCheckAssembly(scope, root, [root], typeName, type),
        returnTrue(),
      ],
      { exported: true }
    );

    this.guards.set(typeName, guard);

    this.ctx = {};
  }

  private createTypeGuardFor(
    guardName: string,
    typeName: string,
    type: TypeModel
  ): ts.Statement {
    const root = "root";
    const scope = new Scope();
    const rootLocal = scope.createAttribute([], root);
    const { hoist, body } = this.getAssertionsForLocalVar(
      scope,
      [],
      rootLocal,
      [typeName],
      type
    );

    return predicateFunction(root, guardName, typeName, [
      // hoist to the top what's returned as hoist
      ...hoist,
      // then follow with the body statements
      ...body,
      // ...assertAreNotNever(scope.list()),
      ...typeSafeCheckAssembly(scope, root, [root], typeName, type),
      returnTrue(),
    ]);
  }

  getGuards(): ts.Statement[] {
    return [...this.guards.values()];
  }

  getFullFileBody(sourceFileName: string): ts.Statement[] {
    for (const { referencedTypeName, referencedFrom } of this
      .referencedTypes) {
      if (!this.guards.has(referencedTypeName)) {
        throw new MissingExportedType(
          referencedFrom,
          referencedTypeName,
          [...this.guards.keys()]
        );
      }
    }

    const typeSafeShallowShape = this.needsSafeShallowShape
      ? getTypeSafeShallowShape()
      : [];

    const safeIsArray = this.needsSafeIsArray
      ? [getSafeIsArray()]
      : [];

    return [
      ...getTypeImports(sourceFileName, [...this.guards.keys()]),
      ...typeSafeShallowShape,
      ...safeIsArray,
      ...this.getGuards(),
    ];
  }
}

function getObjectTypeName(typePath: string[]): [string[], string] {
  if (typePath.length === 0) {
    return [[], "ObjectInRoot"];
  } else if (typePath.length === 1) {
    const rootTypeName = typePath[0];
    assert(rootTypeName, "must have the root type name");
    return [typePath.map(capitalize), `ObjectIn${rootTypeName}`];
  } else {
    const path = typePath.slice();
    const attributeName = path.pop();
    assert(attributeName, "must have the tail attribute name");
    return [
      path.map(capitalize),
      `ObjectIn${capitalize(attributeName)}`,
    ];
  }
}

function getTypeImports(
  sourceFileName: string,
  imports: string[]
): ts.Statement[] {
  return [
    factory.createImportDeclaration(
      undefined,
      factory.createImportClause(
        false,
        undefined,

        factory.createNamedImports(
          imports.map((className) => {
            return factory.createImportSpecifier(
              true,
              undefined,
              factory.createIdentifier(className)
            );
          })
        )
      ),
      factory.createStringLiteral(sourceFileName),
      undefined
    ),
  ];
}

function safeToUseInAUnion(type: TypeModel) {
  return (
    type instanceof LiteralType ||
    type instanceof PrimitiveType ||
    type instanceof AliasType
  );
}

function capitalize(str: string): string {
  const first = str.at(0);
  if (!first) {
    return str;
  }
  return `${first.toUpperCase()}${str.substring(1)}`;
}

function returnTrue(): ts.Statement {
  return factory.createReturnStatement(factory.createTrue());
}

const SafeShallowShape = "SafeShallowShape";

/**
 * Returns nodes for:
 * ```
 * const safeIsArray: (v: unknown) => v is unknown[] = Array.isArray;
 * ```
 */
function getSafeIsArray(): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier("safeIsArray"),
          undefined,
          factory.createFunctionTypeNode(
            undefined,
            [
              factory.createParameterDeclaration(
                undefined,
                undefined,
                factory.createIdentifier("v"),
                undefined,
                factory.createKeywordTypeNode(
                  ts.SyntaxKind.UnknownKeyword
                ),
                undefined
              ),
            ],
            factory.createTypePredicateNode(
              undefined,
              factory.createIdentifier("v"),
              factory.createArrayTypeNode(
                factory.createKeywordTypeNode(
                  ts.SyntaxKind.UnknownKeyword
                )
              )
            )
          ),
          factory.createPropertyAccessExpression(
            factory.createIdentifier("Array"),
            factory.createIdentifier("isArray")
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

/**
 * Returns nodes for:
 * ```
 * type SafeShallowShape<Type> = {
 *  [_ in keyof Type]?: unknown;
 * };
 * ```
 */
function getTypeSafeShallowShape(): ts.Statement[] {
  return [
    factory.createTypeAliasDeclaration(
      undefined,
      factory.createIdentifier(SafeShallowShape),
      [
        factory.createTypeParameterDeclaration(
          undefined,
          factory.createIdentifier("Type"),
          factory.createTypeLiteralNode([]),
          undefined
        ),
      ],
      factory.createMappedTypeNode(
        undefined,
        factory.createTypeParameterDeclaration(
          undefined,
          factory.createIdentifier("_"),
          factory.createTypeOperatorNode(
            ts.SyntaxKind.KeyOfKeyword,
            factory.createTypeReferenceNode(
              factory.createIdentifier("Type"),
              undefined
            )
          ),
          undefined
        ),
        undefined,
        factory.createToken(ts.SyntaxKind.QuestionToken),
        factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
        undefined
      )
    ),
  ];
}

function assertionConditionForArrayType(
  target: string,
  guardName: string
): ts.Expression {
  return factory.createBinaryExpression(
    factory.createCallExpression(
      factory.createIdentifier("safeIsArray"),
      undefined,
      [factory.createIdentifier(target)]
    ),
    factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
    factory.createCallExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(target),
        factory.createIdentifier("every")
      ),
      undefined,
      [factory.createIdentifier(guardName)]
    )
  );
}

function ifNotReturnFalse(
  negatedCondition: ts.Expression
): ts.Statement[] {
  return [
    factory.createIfStatement(
      factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        factory.createParenthesizedExpression(negatedCondition)
      ),
      factory.createBlock(
        [factory.createReturnStatement(factory.createFalse())],
        true
      ),
      undefined
    ),
  ];
}

function or(
  left: ts.Expression,
  right: ts.Expression
): ts.Expression {
  return factory.createBinaryExpression(
    left,
    factory.createToken(ts.SyntaxKind.BarBarToken),
    right
  );
}

function wrapRestInOr(head: ts.Expression, list: ts.Expression[]) {
  if (list.length == 0) {
    return head;
  }

  const [next, ...rest] = list;
  assert(next, "expect the list head to be present");
  return wrapRestInOr(or(head, parens(next)), rest);
}

function wrapListInOr(list: ts.Expression[]) {
  assert(list.length >= 2);
  const [first, second, ...rest] = list;
  assert(first, "expecting first element to be present");
  assert(second, "expecting second element to be present");

  const head = or(parens(first), parens(second));
  return wrapRestInOr(head, rest);
}

function parens(e: ts.Expression): ts.Expression {
  return factory.createParenthesizedExpression(e);
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

function objectSpread(
  target: string,
  properties: AttributeLocal[],
  type: ts.TypeNode
): ts.Statement[] {
  const satisfiesObject = factory.createExpressionStatement(
    factory.createSatisfiesExpression(
      factory.createParenthesizedExpression(
        factory.createIdentifier(target)
      ),
      factory.createTypeLiteralNode([])
    )
  );

  if (properties.length == 0) {
    return [satisfiesObject];
  }
  return [
    satisfiesObject,
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
              [type]
            ),
            factory.createIdentifier(target)
          ),
        ],
        ts.NodeFlags.Const
      )
    ),
  ];
}

type LiteralValue =
  | undefined
  | null
  | string
  | number
  | boolean
  | ts.PseudoBigInt;

function valueToNode(value: LiteralValue): ts.Expression {
  if (value === null) {
    return factory.createNull();
  }
  if (value === undefined) {
    return factory.createIdentifier("undefined");
  }

  if (typeof value === "string") {
    return factory.createStringLiteral(value);
  }

  if (typeof value === "number") {
    return factory.createNumericLiteral(value);
  }

  if (value === true) {
    return factory.createTrue();
  }

  if (value === false) {
    return factory.createFalse();
  }

  unimplemented();
}

/**
 * Expects the path to start with a type name and the rest to be
 * attribute names. `path` should have at least 1 element.
 */
function typePathToTypeSelector(path: string[]): ts.TypeNode {
  assert(path.length >= 1);
  const [root, ...rest] = path;
  assert(root, "expecting the path to start with a root type name");

  return rest.reduce<ts.TypeNode>(
    (acc, attr) =>
      factory.createIndexedAccessTypeNode(
        acc,
        factory.createLiteralTypeNode(
          factory.createStringLiteral(attr)
        )
      ),
    factory.createTypeReferenceNode(
      factory.createIdentifier(root),
      undefined
    )
  );
}

function typeAliasForArrayElement(
  newTypeName: string,
  path: string[]
): ts.Statement {
  return factory.createTypeAliasDeclaration(
    undefined,
    factory.createIdentifier(newTypeName),
    undefined,
    factory.createIndexedAccessTypeNode(
      typePathToTypeSelector(path),
      factory.createKeywordTypeNode(ts.SyntaxKind.NumberKeyword)
    )
  );
}

function typeAliasForObjectAttribute(
  newTypeName: string,
  path: string[]
): ts.Statement {
  return factory.createTypeAliasDeclaration(
    undefined,
    factory.createIdentifier(newTypeName),
    undefined,
    factory.createTypeReferenceNode(
      factory.createIdentifier("Extract"),
      [
        typePathToTypeSelector(path),
        factory.createKeywordTypeNode(ts.SyntaxKind.ObjectKeyword),
      ]
    )
  );
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
  let value: ts.Expression;

  if (type instanceof ObjectType) {
    value = typeSafeCheckObject(scope, path, type);
  } else {
    value = factory.createIdentifier(target);
  }

  return [
    factory.createExpressionStatement(
      factory.createSatisfiesExpression(
        factory.createParenthesizedExpression(value),
        factory.createTypeReferenceNode(
          factory.createIdentifier(typeName),
          undefined
        )
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
  body: ts.Statement[],
  opts: { exported?: boolean } = {}
): ts.Statement {
  return factory.createFunctionDeclaration(
    opts.exported
      ? [factory.createToken(ts.SyntaxKind.ExportKeyword)]
      : [],
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
