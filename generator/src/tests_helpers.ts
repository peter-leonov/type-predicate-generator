import ts from "typescript";
import { factory } from "typescript";
import assert from "assert";
import {
  ensureNoErrors,
  newVFSProgram,
  sourceFileToDeclarationSymbols,
} from "./compile";

export function compile(
  source: string
): [ts.TypeChecker, ts.Type, ts.Symbol] {
  const program = newVFSProgram(source);
  ensureNoErrors(program);

  const sourceFile = program.getSourceFiles()[1];
  assert(
    sourceFile,
    "the program must have 2 source files, one for the lib and one for the actual test code"
  );

  const checker = program.getTypeChecker();

  // This finds the LAST type definition in the source.
  let symbol = sourceFileToDeclarationSymbols(checker, sourceFile).at(
    -1
  );
  assert(
    symbol,
    "at least one symbol must be present in the test case"
  );
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  return [checker, type, symbol];
}

export function printNodes(nodes: ts.Statement[]): string {
  const resultFile = factory.updateSourceFile(
    ts.createSourceFile(
      "guards.ts",
      "",
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS
    ),
    nodes
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });
  return printer.printFile(resultFile);
}
