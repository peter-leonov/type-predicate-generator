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

function generateTypeGuards(fileNames: string[]): boolean {
  // Build a program using the set of root file names in fileNames
  const program = ts.createProgram(fileNames, {
    target: ts.ScriptTarget.ESNext,
    module: ts.ModuleKind.ESNext,
    strict: true,
    noEmit: true,
    isolatedModules: true,
    // don't autoload all the types from the node_modules/@types
    types: [],
    // lib: ["lib.esnext.d.ts"],
  });

  const allDiagnostics = ts.getPreEmitDiagnostics(program);
  if (allDiagnostics.length != 0) {
    allDiagnostics.forEach((diagnostic) => {
      var message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      if (!diagnostic.file) {
        console.log(message);
        return;
      }
      var { line, character } =
        diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start!
        );
      console.log(
        `${diagnostic.file.fileName} (${line + 1},${
          character + 1
        }): ${message}`
      );
    });

    console.error(
      "ts.getPreEmitDiagnostics() found some issues listed above"
    );
    return false;
  }

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

  return true;
}

if (!generateTypeGuards(process.argv.slice(2))) {
  process.exit(1);
}
