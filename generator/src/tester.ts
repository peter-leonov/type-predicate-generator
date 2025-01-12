import ts, { factory } from "typescript";
import {
  combineInvalid,
  combineValid,
  modelToCombinator,
  Reference,
  type Value,
} from "./combinator";
import { type TypeModel } from "./model";
import { assert } from "./helpers";
import { valueToNode } from "./serializer";

export function modelsToTests(
  predicatesFileName: string,
  models: TypeModel[],
  testingLibraryname: string = "vitest"
): ts.Statement[] {
  const predicateNames: string[] = [];

  const tests = [];
  for (const model of models) {
    const typeName = model.options.aliasName;
    assert(
      typeName,
      "root type model has to have the type aliasName defined"
    );
    const predicateName = `is${typeName}`;
    predicateNames.push(predicateName);
    tests.push(...modelToTests(typeName, predicateName, model));
  }

  return [
    testFunctionsImport(testingLibraryname),
    getImports(predicatesFileName, predicateNames),
    defineInvalidValue(),
    ...tests,
  ];
}

export function validVarNameFromType(typeName: string) {
  return `valid_${typeName}`;
}

export function invalidVarNameFromType(typeName: string) {
  return `invalid_${typeName}`;
}

export function modelToTests(
  typeName: string,
  predicateName: string,
  model: TypeModel
): ts.Statement[] {
  const combinator = modelToCombinator(model);

  const valids = combineValid(combinator);
  const validsName = validVarNameFromType(typeName);

  const invalids = combineInvalid(combinator);
  const invalidsName = invalidVarNameFromType(typeName);

  return [
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

function valuesVar(name: string, values: Value[]): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          factory.createArrayLiteralExpression(
            valuesToExpression(values),
            true
          )
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export const invalidValueVarName = "invalidValue";

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

function valuesToExpression(values: Value[]): ts.Expression[] {
  const res: ts.Expression[] = [];

  const seen = new Set();
  for (const value of values) {
    const json = JSON.stringify(value, (_, v: unknown) => {
      if (typeof v === "symbol") {
        return String(v);
      }
      if (typeof v === "undefined") {
        return String(v);
      }
      if (v instanceof Reference) {
        return { __type: "Reference", ...v };
      }
      return v;
    });
    if (seen.has(json)) {
      continue;
    }
    seen.add(json);

    res.push(valueToNode(value));
  }

  return res;
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
                          factory.createKeywordTypeNode(
                            ts.SyntaxKind.UnknownKeyword
                          ),
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
                          factory.createKeywordTypeNode(
                            ts.SyntaxKind.UnknownKeyword
                          ),
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

function testFunctionsImport(from: string): ts.Statement {
  return factory.createImportDeclaration(
    undefined,
    factory.createImportClause(
      false,
      undefined,
      factory.createNamedImports([
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier("expect")
        ),
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier("describe")
        ),
        factory.createImportSpecifier(
          false,
          undefined,
          factory.createIdentifier("it")
        ),
      ])
    ),
    factory.createStringLiteral(from),
    undefined
  );
}
