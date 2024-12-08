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
                  id.isSame()
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

class AttributeLocal {
  readonly path: string[];
  readonly local_name: string;
  readonly attribute_name: string;
  constructor(
    path: string[],
    original_name: string,
    local_name: string
  ) {
    this.path = path;
    this.attribute_name = original_name;
    this.local_name = local_name;
  }

  isSame(): boolean {
    return this.attribute_name == this.local_name;
  }
}

/**
 * Convrst a attribute name that is can effectively be any string
 * to a safe local variable name. For simplicity it ignores Unicode.
 */
function objectAttributeToLocalName(attribute: string): string {
  return attribute
    .replace(/[^_a-zA-Z0-9]/g, "_")
    .replace(/^([^_a-zA-Z])/, "_$1");
}

class Scope {
  #prefixed_names: Set<string>;
  #local_names: Set<string>;

  constructor() {
    this.#prefixed_names = new Set();
    this.#local_names = new Set();
  }

  /**
   * `path` is a list of unique local names of the parent objects.
   */
  createAttribute(path: string[], name: string): AttributeLocal {
    // Use local names are safe to join by "."
    const prefixed_name = [...path, name].join(".");
    if (this.#prefixed_names.has(prefixed_name)) {
      throw new Error(
        `a local with prefixed name ${JSON.stringify(
          prefixed_name
        )} already exists`
      );
    }

    const desired_local_name = objectAttributeToLocalName(name);
    const local_name = this.getNewLocalName(path, desired_local_name);
    return new AttributeLocal(path, name, local_name);
  }

  private getNewLocalName(path: string[], name: string): string {
    if (!this.#local_names.has(name)) {
      this.#local_names.add(name);
      return name;
    }

    for (let i = 0; i < path.length; i++) {
      const prefixed = [...path.slice(-i - 1), name].join("_");
      if (!this.#local_names.has(prefixed)) {
        this.#local_names.add(prefixed);
        return prefixed;
      }
    }

    for (let i = 2; i < 10_000; i++) {
      const name2 = `${name}_${i}`;
      if (!this.#local_names.has(name2)) {
        this.#local_names.add(name2);
        return name2;
      }
    }
    throw new Error(`too many unique locals of name ${name}`);
  }

  list(): string[] {
    return [...this.#local_names.values()];
  }
}

type FakeType = "string" | "number" | { [key: string]: FakeType };

function typePathToTypeSelector(path: string[]): string {
  const [root, ...rest] = path;
  return `${root}${rest.map((attr) => `[${JSON.stringify(attr)}]`)}`;
}

function getAssertionsForVar(
  scope: Scope,
  target: AttributeLocal,
  typePath: string[],
  type: FakeType
): ts.Statement[] {
  if (typeof type === "object") {
    const entries = Object.entries(type).map(
      ([attr, type]) =>
        [
          scope.createAttribute(
            [...target.path, target.local_name],
            attr
          ),
          type,
        ] as const
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
        return getAssertionsForVar(
          scope,
          local,
          [...typePath, local.attribute_name],
          type
        );
      }),
    ];
  } else if (type == "string" || type == "number") {
    return [...assertPrimitiveType(target.local_name, type)];
  }

  throw new Error(`not implemented: ${type}`);
}

const model: FakeType = {
  name: "string",
  age: "number",
  'wicked " prop': "string",
  nested: {
    name: "string",
    b: "number",
  },
};

function typeGuard(
  checker: ts.TypeChecker,
  type: ts.Type
): ts.Statement {
  const typeName = checker.typeToString(type);

  const root = "root";
  const scope = new Scope();
  const rootLocal = scope.createAttribute([], root);

  return predicateFunction(root, `is${typeName}`, typeName, [
    ...getAssertionsForVar(scope, rootLocal, [typeName], model),
    ...assertAreNotNever(scope.list()),
  ]);
  // console.log(type.getProperties());
  // console.log(type.flags & ts.TypeFlags.Object);
}

function generateTypeGuards(
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

generateTypeGuards(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});
