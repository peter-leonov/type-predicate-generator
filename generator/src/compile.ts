import ts from "typescript";
import { TypeGuardGenerator } from "./generator";
import { assert } from "./helpers";
import { typeToModel } from "./model";

export function generatePredicatesForAllTypes(
  checker: ts.TypeChecker,
  sourceFile: ts.SourceFile,
  importFrom: string
): ts.Statement[] {
  const generator = new TypeGuardGenerator();

  // Walk the tree to search for types
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      let symbol = checker.getSymbolAtLocation(node.name);
      assert(symbol, "type alias declaration must have a symbol");
      const model = typeToModel(
        checker,
        checker.getDeclaredTypeOfSymbol(symbol),
        symbol
      );

      generator.addRootTypeGuardFor(model);
    }

    if (ts.isInterfaceDeclaration(node)) {
      let symbol = checker.getSymbolAtLocation(node.name);
      assert(symbol, "interface declaration must have a symbol");
      const model = typeToModel(
        checker,
        checker.getDeclaredTypeOfSymbol(symbol),
        symbol
      );

      generator.addRootTypeGuardFor(model);
    }
  });

  return generator.getFullFileBody(importFrom);
}
