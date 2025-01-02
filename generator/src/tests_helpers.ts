import ts from "typescript";
import { factory } from "typescript";
import { unimplemented } from "./helpers";
import { ok } from "assert";

/**
 * This is required for both `X[]` and `Array<X>` to work properly.
 * Otherwise `checker.isArrayType()` is not gonna work.
 */
const libFileContent = `/// <reference no-default-lib="true"/>
interface Boolean {}
interface Function {}
interface CallableFunction {}
interface NewableFunction {}
interface IArguments {}
interface Number { toExponential: any; }
interface Object {}
interface RegExp {}
interface String { charAt: any; }
interface Array<T> { length: number; [n: number]: T; }
interface ReadonlyArray<T> {}
declare const console: { log(msg: any): void; };`;

export function compile(
  source: string
): [ts.TypeChecker, ts.Type, ts.Symbol] {
  const fileName = "/source.ts";

  const files = new Map<string, string>();
  files.set(fileName, source);

  const libFileName = "/lib/lib.d.ts";
  files.set(libFileName, libFileContent);

  const compilerHost: ts.CompilerHost = {
    fileExists: (fileName) => files.has(fileName),
    getSourceFile: (fileName, options) => {
      const content = files.get(fileName);
      ok(content);
      return ts.createSourceFile(fileName, content, options);
    },
    getDefaultLibFileName: () => "/lib/lib.d.ts",
    writeFile: unimplemented,
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    getCanonicalFileName: (f) => f.toLowerCase(),
    getNewLine: () => "\n",
    useCaseSensitiveFileNames: () => false,
    readFile: (path) => files.get(path),
  };

  const program = ts.createProgram(
    [fileName],
    {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      strict: true,
      noEmit: true,
      isolatedModules: true,
      // don't autoload all the types from the node_modules/@types
      types: [],
    },
    compilerHost
  );

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
  ok(sourceFile);

  const checker = program.getTypeChecker();

  // This finds the LAST type definition in the source.
  let symbol: ts.Symbol | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) {
      return;
    }

    symbol = checker.getSymbolAtLocation(node.name);
    ok(symbol);
    // console.dir(checker.getTypeFromTypeNode(node.type));
  });

  ok(symbol);
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
