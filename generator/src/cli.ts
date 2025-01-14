#!/usr/bin/env node
import ts from "typescript";
import fs from "node:fs";
import path from "node:path";
import {
  ensureNoErrors,
  nodesToString,
  sourceFileToModels,
} from "./compile";
import { explainError } from "./errors";
import { TypeGuardGenerator } from "./generator";
import { modelsToTests } from "./tester";

type Flags = {
  help?: boolean;
  keepExtension?: boolean;
  withStacktrace?: boolean;
  unitTests?: boolean;
};

function processFile(typesPath: string, flags: Flags) {
  // Build a program using the set of root file names in fileNames
  const program = ts.createProgram([typesPath], {
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

    const dirName = path.dirname(typesPath);
    const typesFileName = path.basename(typesPath);
    const typesFileNameNoExt = typesFileName.replace(/\.[^.]+$/, "");
    const typesImportFrom = `./${
      flags.keepExtension ? typesPath : typesFileNameNoExt
    }`;
    const guardsFileNameNoExt = `${typesFileNameNoExt}_guards`;
    const guardsFileName = `${guardsFileNameNoExt}.ts`;
    const guardsImportFrom = `./${
      flags.keepExtension ? guardsFileName : guardsFileNameNoExt
    }`;
    const testsFileNameNoExt = `${typesFileNameNoExt}_guards.test`;
    const testsFileName = `${testsFileNameNoExt}.ts`;
    const testsPath = path.join(dirName, testsFileName);

    const guardsPath = path.join(
      dirName,
      `${guardsFileNameNoExt}.ts`
    );

    const generator = new TypeGuardGenerator();

    const models = sourceFileToModels(checker, sourceFile);

    {
      for (const model of models) {
        generator.addRootTypeGuardFor(model);
      }

      const predicateFileBody =
        generator.getFullFileBody(typesImportFrom);

      const content = nodesToString(
        guardsFileName,
        predicateFileBody
      );
      fs.writeFileSync(guardsPath, content);
    }

    if (flags.unitTests) {
      const nodes = modelsToTests(guardsImportFrom, models);
      const content = nodesToString(testsFileName, nodes);
      fs.writeFileSync(testsPath, content);
    }
  }
}

function usage() {
  console.error(
    `Usage: type-predicate-generator [--help] [--keepExtension] [--withStacktrace] [--unitTests] source.ts`
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

  if (flags.help) {
    usage();
    return 0;
  }

  if (filenames.length == 0) {
    console.error("Error: no input file specified");
    usage();
    return 3;
  }

  for (const fileName of filenames) {
    try {
      const stats = fs.statSync(fileName);
      if (!stats.isFile()) {
        console.error(`error openning file ${fileName}: not a file`);
        return 3;
      }
    } catch (err) {
      console.error(`error openning file ${fileName}: ${err}`);
      return 3;
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
  }
  return 0;
}

process.exit(main(process.argv.slice()));
