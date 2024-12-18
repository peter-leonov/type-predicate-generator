import { ok } from "node:assert";
import ts from "typescript";
import { factory } from "typescript";
import { typeToModel } from "./model.mts";
import { TypeGuardGenerator } from "./generator.mts";

function generateTypeGuards(fileName: string): boolean {
  // Build a program using the set of root file names in fileNames
  const program = ts.createProgram([fileName], {
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
        `guards.ts`,
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
      ),
      generator.getFullFileBody(fileName)
    );

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    });
    console.log(printer.printFile(resultFile));
  }

  return true;
}

const fileName = process.argv.slice(2)[0];

if (!fileName) {
  console.error(`Usage: generator source.ts`);
  process.exit(1);
} else {
  if (!generateTypeGuards(fileName)) {
    process.exit(1);
  }
}
