import ts, { factory } from "typescript";
import {
  combineInvalid,
  combineValid,
  invalidValue,
  modelToCombinator,
} from "./combinator";
import { TypeModel } from "./model";
import { assert } from "./helpers";

export function modelToTests(
  predicatesFileName: string,
  typeName: string,
  model: TypeModel
): ts.Statement[] {
  const predicateName = `is${typeName}`;

  const combinator = modelToCombinator(model);

  const valids = combineValid(combinator);
  const validsName = `valid_${typeName}`;

  const invalids = combineInvalid(combinator);
  const invalidsName = `invalid_${typeName}`;

  return [
    getImports(predicatesFileName, [predicateName]),
    defineInvalidValue(),
    valuesVar(validsName, valids),
    valuesVar(invalidsName, invalids),
    describeItFor(typeName, validsName, invalidsName, predicateName),
  ];
}

function getImports(
  sourceFileName: string,
  imports: string[]
): ts.Statement {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,

      factory.createNamedImports(
        imports.map((className) => {
          return factory.createImportSpecifier(
            false,
            undefined,
            factory.createIdentifier(className)
          );
        })
      )
    ),
    factory.createStringLiteral(sourceFileName),
    undefined
  );
}

function valuesVar(name: string, values: unknown[]): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          factory.createArrayLiteralExpression(
            values.map(valueToExpression),
            true
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

const invalidValueVarName = "invalidValue";

function defineInvalidValue(): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(invalidValueVarName),
          undefined,
          factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
          factory.createCallExpression(
            factory.createIdentifier("Symbol"),
            undefined,
            [factory.createStringLiteral("invalidValue")]
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export const invalidValueToken =
  "80D79A5A-5D38-4302-BA04-F5AC748C1464";

function valueToExpression(value: unknown): ts.Expression {
  const json = JSON.stringify(value, (_, v) => {
    return v === invalidValue ? invalidValueToken : v;
  });
  const file = ts.parseJsonText("valueToJSONExpression", json);
  const statement = file.statements[0];
  assert(statement, "must have a single statement");
  return statement.expression;
}

/**
 * Dirty hack to avoid wirting a JS value to Node parser just to cover
 * the invalid value symbol.
 */
export function hydrateInvalidValueToken(code: string): string {
  return code.replaceAll(
    `"${invalidValueToken}"`,
    invalidValueVarName
  );
}

function describeItFor(
  describeName: string,
  validsName: string,
  invalidsName: string,
  predicateName: string
): ts.Statement {
  return factory.createExpressionStatement(
    factory.createCallExpression(
      factory.createIdentifier("describe"),
      undefined,
      [
        factory.createStringLiteral(describeName),
        factory.createArrowFunction(
          undefined,
          undefined,
          [],
          undefined,
          factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
          factory.createBlock(
            [
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("it"),
                      factory.createIdentifier("for")
                    ),
                    undefined,
                    [factory.createIdentifier(validsName)]
                  ),
                  undefined,
                  [
                    factory.createStringLiteral("valid"),
                    factory.createArrowFunction(
                      undefined,
                      undefined,
                      [
                        factory.createParameterDeclaration(
                          undefined,
                          undefined,
                          factory.createIdentifier("value"),
                          undefined,
                          undefined,
                          undefined
                        ),
                      ],
                      undefined,
                      factory.createToken(
                        ts.SyntaxKind.EqualsGreaterThanToken
                      ),
                      factory.createBlock(
                        [
                          factory.createExpressionStatement(
                            factory.createCallExpression(
                              factory.createPropertyAccessExpression(
                                factory.createCallExpression(
                                  factory.createIdentifier("expect"),
                                  undefined,
                                  [
                                    factory.createCallExpression(
                                      factory.createIdentifier(
                                        predicateName
                                      ),
                                      undefined,
                                      [
                                        factory.createIdentifier(
                                          "value"
                                        ),
                                      ]
                                    ),
                                  ]
                                ),
                                factory.createIdentifier("toBe")
                              ),
                              undefined,
                              [factory.createTrue()]
                            )
                          ),
                        ],
                        true
                      )
                    ),
                  ]
                )
              ),
              factory.createExpressionStatement(
                factory.createCallExpression(
                  factory.createCallExpression(
                    factory.createPropertyAccessExpression(
                      factory.createIdentifier("it"),
                      factory.createIdentifier("for")
                    ),
                    undefined,
                    [factory.createIdentifier(invalidsName)]
                  ),
                  undefined,
                  [
                    factory.createStringLiteral("invalid"),
                    factory.createArrowFunction(
                      undefined,
                      undefined,
                      [
                        factory.createParameterDeclaration(
                          undefined,
                          undefined,
                          factory.createIdentifier("value"),
                          undefined,
                          undefined,
                          undefined
                        ),
                      ],
                      undefined,
                      factory.createToken(
                        ts.SyntaxKind.EqualsGreaterThanToken
                      ),
                      factory.createBlock(
                        [
                          factory.createExpressionStatement(
                            factory.createCallExpression(
                              factory.createPropertyAccessExpression(
                                factory.createCallExpression(
                                  factory.createIdentifier("expect"),
                                  undefined,
                                  [
                                    factory.createCallExpression(
                                      factory.createIdentifier(
                                        predicateName
                                      ),
                                      undefined,
                                      [
                                        factory.createIdentifier(
                                          "value"
                                        ),
                                      ]
                                    ),
                                  ]
                                ),
                                factory.createIdentifier("toBe")
                              ),
                              undefined,
                              [factory.createFalse()]
                            )
                          ),
                        ],
                        true
                      )
                    ),
                  ]
                )
              ),
            ],
            true
          )
        ),
      ]
    )
  );
}
