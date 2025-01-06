import ts from "typescript";
import { factory } from "typescript";
import assert from "assert";
import { ensureDiagnostics, newVFSProgram } from "./compile";

export function compile(
  source: string
): [ts.TypeChecker, ts.Type, ts.Symbol] {
  const program = newVFSProgram(source);
  ensureDiagnostics(program);

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

    throw new Error(
      "ts.getPreEmitDiagnostics() found some issues listed above"
    );
  }

  const sourceFile = program.getSourceFiles()[1];
  assert(
    sourceFile,
    "the program must have 2 source files, one for the lib and one for the actual test code"
  );

  const checker = program.getTypeChecker();

  // This finds the LAST type definition in the source.
  let symbol: ts.Symbol | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isTypeAliasDeclaration(node)) {
      symbol = checker.getSymbolAtLocation(node.name);
      assert(symbol, "type alias declaration must have a symbol");
      return;
    }

    if (ts.isInterfaceDeclaration(node)) {
      symbol = checker.getSymbolAtLocation(node.name);
      assert(symbol, "interface declaration must have a symbol");
      return;
    }
  });

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
