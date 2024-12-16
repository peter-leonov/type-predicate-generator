import { inspect } from "node:util";
import { ok } from "node:assert";
import * as ts from "typescript";
import { factory } from "typescript";
import {
  ObjectType,
  PrimitiveType,
  type TypeModel,
  typeToModel,
} from "./model.mts";

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

class AttributeLocal {
  readonly local_name: string;
  readonly attribute_name: string;
  constructor(attribute_name: string, local_name: string) {
    this.attribute_name = attribute_name;
    this.local_name = local_name;
  }

  isShorthand(): boolean {
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

/**
 * A list of the object attribute names leading up to the value
 * excuding the target attribute.
 */
type Path = string[];

class Scope {
  #by_full_path: Map<string, AttributeLocal>;
  #local_names: Set<string>;

  constructor() {
    this.#by_full_path = new Map();
    this.#local_names = new Set();
  }

  /**
   * `path` is a list of attributes leading to the value.
   */
  createAttribute(
    path: Path,
    attribute_name: string
  ): AttributeLocal {
    const key = JSON.stringify([...path, attribute_name]);
    if (this.#by_full_path.has(key)) {
      throw new Error(
        `a local with prefixed name ${key} already exists`
      );
    }

    const desired_local_name =
      objectAttributeToLocalName(attribute_name);
    const local_name = this.getNewLocalName(path, desired_local_name);
    const attr = new AttributeLocal(attribute_name, local_name);
    this.#by_full_path.set(key, attr);
    return attr;
  }

  getByPath(path: Path, name: string): AttributeLocal {
    const key = JSON.stringify([...path, name]);
    const value = this.#by_full_path.get(key);
    if (!value) {
      console.error(this.#by_full_path);
      throw new Error(
        `a local with prefixed name ${key} does not exist`
      );
    }
    return value;
  }

  private getNewLocalName(path: Path, name: string): string {
    if (!this.#local_names.has(name)) {
      this.#local_names.add(name);
      return name;
    }

    for (let i = 0; i < path.length; i++) {
      const prefixed = [...path.slice(-i - 1), name]
        .map(objectAttributeToLocalName)
        .join("_");
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

function typePathToTypeSelector(path: Path): string {
  const [root, ...rest] = path;
  return `${root}${rest.map((attr) => `[${JSON.stringify(attr)}]`)}`;
}

class TypeGuardGenerator {
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
    }

    throw new Error(`not implemented: ${type}`);
  }

  addTypeGuard(type: TypeModel): void {
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
      ...typeSafeCheckAssembly(scope, [root], typeName, type),
    ]);

    this.guards.push(guard);
  }

  getGuards(): ts.Statement[] {
    return this.guards;
  }
}

function typeSafeCheckObject(
  scope: Scope,
  path: Path,
  type: ObjectType
): ts.Expression {
  const attributes = Object.entries(type.attributes).map(
    ([attr, type]) => {
      const local = scope.getByPath(path, attr);
      if (type instanceof ObjectType) {
        return factory.createPropertyAssignment(
          factory.createIdentifier(local.local_name),
          typeSafeCheckObject(scope, [...path, attr], type)
        );
      } else {
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
    }
  );

  return factory.createObjectLiteralExpression(attributes, true);
}

function typeSafeCheckAssembly(
  scope: Scope,
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
    throw new Error("not implemented");
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

    const generator = new TypeGuardGenerator();

    // Walk the tree to search for types
    ts.forEachChild(sourceFile, (node) => {
      if (!ts.isTypeAliasDeclaration(node)) {
        return;
      }

      let symbol = checker.getSymbolAtLocation(node.name);
      ok(symbol);
      // console.log(
      //   inspect(
      //     typeToModel(
      //       checker,
      //       checker.getDeclaredTypeOfSymbol(symbol)
      //     ),
      //     { depth: null }
      //   )
      // );

      const model = typeToModel(
        checker,
        checker.getDeclaredTypeOfSymbol(symbol)
      );

      generator.addTypeGuard(model);
    });

    const resultFile = factory.updateSourceFile(
      ts.createSourceFile(
        "guards.ts",
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
      ),
      generator.getGuards()
    );
    console.log(printer.printFile(resultFile));
  }
}

generateTypeGuards(process.argv.slice(2), {
  target: ts.ScriptTarget.ES5,
  module: ts.ModuleKind.CommonJS,
});
