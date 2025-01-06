#!/usr/bin/env node
import ts, { factory } from "typescript";
import fs from "node:fs";
import {
  ensureDiagnostics,
  generateFullFileBodyForAllTypes,
} from "./compile";

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

  ensureDiagnostics(program);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) {
      continue;
    }

    const fileNameNoExt = fileName.replace(/\.\w+$/, "");
    const importFrom = flags.keepExtension ? fileName : fileNameNoExt;

    const predicateFileBody = generateFullFileBodyForAllTypes(
      checker,
      sourceFile,
      importFrom
    );

    const resultFile = factory.updateSourceFile(
      ts.createSourceFile(
        `guards.ts`,
        "",
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
      ),
      predicateFileBody
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
