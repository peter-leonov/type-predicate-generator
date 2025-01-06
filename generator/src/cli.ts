#!/usr/bin/env node
import ts, { factory } from "typescript";
import fs from "node:fs";
import { typeToModel } from "./model";
import { TypeGuardGenerator } from "./generator";
import { assert } from "./helpers";

function generateTypeGuards(fileName: string, flags: Flags): boolean {
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
        console.error(message);
        return;
      }
      var { line, character } =
        diagnostic.file.getLineAndCharacterOfPosition(
          diagnostic.start!
        );
      console.error(
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

    const fileNameNoExt = fileName.replace(/\.\w+$/, "");

    const importFrom = flags.keepExtension ? fileName : fileNameNoExt;

    const resultFile = factory.updateSourceFile(
      ts.createSourceFile(
        `guards.ts`,
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
      ),
      generator.getFullFileBody(importFrom)
    );

    const printer = ts.createPrinter({
      newLine: ts.NewLineKind.LineFeed,
    });

    const content = printer.printFile(resultFile);
    const suffix = "_guards.ts";
    const outputFile = `${fileNameNoExt}${suffix}`;
    fs.writeFileSync(outputFile, content);
  }

  return true;
}

const args = process.argv.slice(2);

const opts = args.filter((arg) => arg.startsWith("--"));
type Flags = {
  keepExtension?: boolean;
};
const flags: Flags = {};
for (const flag of opts.map((opt) => opt.replace("--", ""))) {
  flags[flag as unknown as keyof Flags] = true;
}

const filenames = args.filter((arg) => !arg.startsWith("--"));

if (filenames.length >= 2) {
  console.error(
    `Error: generator does not support multiple file input yet.`
  );
  usage();
  process.exit(1);
}

const fileName = filenames[0];

if (!fileName) {
  console.error("Error: missing input file.");
  usage();
  process.exit(1);
} else {
  if (!generateTypeGuards(fileName, flags)) {
    process.exit(1);
  }
}

function usage() {
  console.error(`Usage: type-predicate-generator source.ts`);
}
