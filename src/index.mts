import * as ts from "typescript";
import { factory } from "typescript";

function ok(
  value: unknown,
  message: string = "assertion failed"
): asserts value {
  if (!value) {
    throw new Error(message);
  }
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
  properties: string[],
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
                  undefined,
                  factory.createIdentifier(id),
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
  type: "string" | "number"
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

function typeGuard(
  checker: ts.TypeChecker,
  type: ts.Type
): ts.Statement {
  const typeName = checker.typeToString(type);

  const subject = "root";

  return predicateFunction(subject, `is${typeName}`, typeName, [
    ...assertIsObject(subject),
    ...objectSpread(subject, ["name", "age"], typeName),
    ...assertPrimitiveType("name", "string"),
    ...assertPrimitiveType("age", "number"),
    ...assertAreNotNever([subject, "name", "age"]),
  ]);
  // console.log(type.getProperties());
  // console.log(type.flags & ts.TypeFlags.Object);
}

function generateDocumentation(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);
  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) {
      continue;
    }
    // Walk the tree to search for types
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isTypeAliasDeclaration(node)) {
        return;
      }

      let symbol = checker.getSymbolAtLocation(node.name);
      ok(symbol);
      let type = checker.getDeclaredTypeOfSymbol(symbol);
      const guard = typeGuard(checker, type);
      const resultFile = factory.updateSourceFile(
        ts.createSourceFile(
          "guards.ts",
          "",
          ts.ScriptTarget.Latest,
          /*setParentNodes*/ false,
          ts.ScriptKind.TS
        ),
        [guard]
      );
      console.log(printer.printFile(resultFile));
    });
  }
}

generateDocumentation(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});
