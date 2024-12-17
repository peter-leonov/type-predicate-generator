import { ok } from "node:assert";
import ts from "typescript";
import { factory } from "typescript";
import {
  ObjectType,
  PrimitiveType,
  type TypeModel,
  typeToModel,
} from "./model.mts";
import { AttributeLocal, type Path, Scope } from "./scope.mts";
import { TypeGuardGenerator } from "./generator.mts";

function generateTypeGuards(
  fileNames: string[],
  options: ts.CompilerOptions
): void {
  // Build a program using the set of root file names in fileNames
  let program = ts.createProgram(fileNames, options);
  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

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
      const model = typeToModel(
        checker,
        checker.getDeclaredTypeOfSymbol(symbol),
        symbol
      );

      generator.addTypeGuardFor(model);
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

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    });
    console.log(printer.printFile(resultFile));
  }
}

generateTypeGuards(process.argv.slice(2), {
  target: ts.ScriptTarget.ESNext,
  module: ts.ModuleKind.ESNext,
});
