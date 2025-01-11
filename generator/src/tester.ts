import ts, { factory } from "typescript";
import {
  combineInvalid,
  combineValid,
  invalidValue,
  modelToCombinator,
  Token,
} from "./combinator";
import { type TypeModel } from "./model";
import { assert } from "./helpers";

type TokenMap = Map<string, string>;

export function modelsToTests(
  predicatesFileName: string,
  models: TypeModel[],
  testingLibraryname: string = "vitest"
): [TokenMap, ts.Statement[]] {
  const predicateNames: string[] = [];
  const tests = [];
  const stringToToken: TokenMap = new Map();
  const tokenToString: TokenMap = new Map();
  for (const model of models) {
    const typeName = model.options.aliasName;
    assert(
      typeName,
      "root type model has to have the type aliasName defined"
    );

    const validID = crypto.randomUUID();
    stringToToken.set(`valid:${typeName}`, validID);
    tokenToString.set(
      validID,
      `${validVarNameFromType(typeName)}[0]`
    );

    const invalidID = crypto.randomUUID();
    stringToToken.set(`invalid:${typeName}`, invalidID);
    tokenToString.set(
      invalidID,
      `${invalidVarNameFromType(typeName)}[0]`
    );
  }

  for (const model of models) {
    const typeName = model.options.aliasName;
    assert(
      typeName,
      "root type model has to have the type aliasName defined"
    );
    const predicateName = `is${typeName}`;
    predicateNames.push(predicateName);
    tests.push(
      ...modelToTests(typeName, predicateName, model, stringToToken)
    );
  }

  return [
    tokenToString,
    [
      testFunctionsImport(testingLibraryname),
      getImports(predicatesFileName, predicateNames),
      defineInvalidValue(),
      ...tests,
    ],
  ];
}

function validVarNameFromType(typeName: string) {
  return `valid_${typeName}`;
}

function invalidVarNameFromType(typeName: string) {
  return `invalid_${typeName}`;
}

export function modelToTests(
  typeName: string,
  predicateName: string,
  model: TypeModel,
  stringToToken: Map<string, string>
): ts.Statement[] {
  const combinator = modelToCombinator(model);

  const valids = combineValid(combinator);
  const validsName = validVarNameFromType(typeName);

  const invalids = combineInvalid(combinator);
  const invalidsName = invalidVarNameFromType(typeName);

  return [
    valuesVar(validsName, valids, stringToToken),
    valuesVar(invalidsName, invalids, stringToToken),
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

function valuesVar(
  name: string,
  values: unknown[],
  stringToToken: Map<string, string>
): ts.Statement {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createIdentifier(name),
          undefined,
          undefined,
          factory.createArrayLiteralExpression(
            valuesToExpression(values, stringToToken),
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

function valuesToExpression(
  values: unknown[],
  stringToToken: Map<string, string>
): ts.Expression[] {
  const res: ts.Expression[] = [];

  const seen = new Set();
  for (const value of values) {
    const json = JSON.stringify(value, (_, v): string => {
      if (v === invalidValue) return invalidValueToken;
      if (v instanceof Token) {
        const token = stringToToken.get(v.token);
        assert(
          token,
          `the token for type reference ${v.token} must be present`
        );
        return token;
      }
      return v;
    });
    if (seen.has(json)) {
      continue;
    }
    seen.add(json);
    const file = ts.parseJsonText("valueToJSONExpression", json);
    const statement = file.statements[0];
    assert(statement, "must have a single statement");
    res.push(statement.expression);
  }

  return res;
}

/**
 * Dirty hack to avoid wirting a JS value to Node serializer just to cover
 * the invalid value symbol and reference types.
 */
export function hydrateTokens(
  code: string,
  tokens: TokenMap
): string {
  tokens.set(invalidValueToken, invalidValueVarName);
  const keys = [...tokens.keys()];
  const rex = new RegExp(`"(${keys.join("|")})"`, "g");
  return code.replaceAll(rex, (_, p1) => {
    const value = tokens.get(p1);
    assert(value, "the replacing value must be present");
    return value;
  });
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
