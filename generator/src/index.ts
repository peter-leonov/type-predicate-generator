import ts, { factory } from "typescript";
import { assert } from "./helpers";
import {
  ensureNoErrors,
  generateFullFileBodyForAllTypes,
  newVFSProgram,
} from "./compile";

export function generateTypeGuards(
  source: string,
  importFrom = "./example"
): string {
  const program = newVFSProgram(source);
  ensureNoErrors(program);

  const sourceFile = program.getSourceFiles()[1];
  assert(
    sourceFile,
    "the program must have 2 source files, one for the lib and one for the actual test code"
  );

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  const predicateFileBody = generateFullFileBodyForAllTypes(
    checker,
    sourceFile,
    importFrom
  );

  const resultFile = factory.updateSourceFile(
    ts.createSourceFile(
      `example_guards.ts`,
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

  return printer.printFile(resultFile);
}
