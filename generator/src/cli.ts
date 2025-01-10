#!/usr/bin/env node
import ts from "typescript";
import fs from "node:fs";
import {
  ensureNoErrors,
  nodesToString,
  sourceFileToModels,
} from "./compile";
import { explainError } from "./errors";
import { TypeGuardGenerator } from "./generator";

type Flags = {
  keepExtension?: boolean;
  withStacktrace?: boolean;
};

function processFile(fileName: string, flags: Flags): boolean {
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

  ensureNoErrors(program);

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  // Visit every sourceFile in the program
  for (const sourceFile of program.getSourceFiles()) {
    if (sourceFile.isDeclarationFile) {
      continue;
    }

    const fileNameNoExt = fileName.replace(/\.\w+$/, "");
    const importFrom = flags.keepExtension ? fileName : fileNameNoExt;

    const generator = new TypeGuardGenerator();

    const models = sourceFileToModels(checker, sourceFile);
    const suffix = "_guards.ts";
    const outputFile = `${fileNameNoExt}${suffix}`;

    {
      for (const model of models) {
        generator.addRootTypeGuardFor(model);
      }

      const predicateFileBody = generator.getFullFileBody(importFrom);

      const content = nodesToString(outputFile, predicateFileBody);
      fs.writeFileSync(outputFile, content);
    }

    // {
    //   const tests = hydrateInvalidValueToken(
    //     nodesToString(
    //       "tests.test.ts",
    //       modelsToTests("guards.ts", models)
    //     )
    //   );
    // }
  }

  return true;
}

function usage() {
  console.error(
    `Usage: type-predicate-generator [--keepExtension] [--withStacktrace] source.ts`
  );
}

function main(argv: string[]): number {
  const args = argv.slice(2);

  const opts = args.filter((arg) => arg.startsWith("--"));
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
    return 3;
  }

  const fileName = filenames[0];
  if (!fileName) {
    console.error("Error: missing input file.");
    usage();
    return 2;
  }

  try {
    processFile(fileName, flags);
  } catch (err) {
    if (flags.withStacktrace) {
      console.error(err);
    }
    console.error(explainError(err, false));
    return 1;
  }

  return 0;
}

process.exit(main(process.argv.slice()));
