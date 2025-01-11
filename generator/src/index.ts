import ts, { factory } from "typescript";
import { assert } from "./helpers";
import {
  ensureNoErrors,
  newVFSProgram,
  nodesToString,
  sourceFileToModels,
} from "./compile";
import { TypeGuardGenerator } from "./generator";
import { hydrateTokens, modelsToTests } from "./tester";

export * from "./errors";

type Result = { predicatesCode?: string; testsCode?: string };

export function generateForPlayground(
  source: string,
  sourceFilePath: string,
  guardsFilePath: string,
  unitTests: boolean = false
): Result {
  const program = newVFSProgram(source);
  ensureNoErrors(program);

  const sourceFile = program.getSourceFiles()[1];
  assert(
    sourceFile,
    "the program must have 2 source files, one for the lib and one for the actual test code"
  );

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  const generator = new TypeGuardGenerator();

  const models = sourceFileToModels(checker, sourceFile);

  let predicatesCode: string, testsCode: string;

  {
    for (const model of models) {
      generator.addRootTypeGuardFor(model);
    }

    const predicateFileBody =
      generator.getFullFileBody(sourceFilePath);

    predicatesCode = nodesToString(guardsFilePath, predicateFileBody);
  }

  if (unitTests) {
    const [tokens, nodes] = modelsToTests(guardsFilePath, models);
    testsCode = hydrateTokens(
      nodesToString("tests.test.ts", nodes),
      tokens
    );
  } else {
    testsCode = "";
  }

  return { predicatesCode, testsCode };
}
