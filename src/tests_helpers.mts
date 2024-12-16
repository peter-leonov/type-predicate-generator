import ts from "typescript";
import { unimplemented } from "./helpers.mts";
import { ok } from "assert";

export function compile(
  source: string
): [ts.TypeChecker, ts.Type, ts.Symbol] {
  const fileName = "/source.ts";

  const sourceFiles = new Map<string, ts.SourceFile>();
  sourceFiles.set(
    fileName,
    ts.createSourceFile(fileName, source, ts.ScriptTarget.ESNext)
  );

  const compilerHost: ts.CompilerHost = {
    fileExists: (fileName) => sourceFiles.has(fileName),
    getSourceFile: (fileName) => sourceFiles.get(fileName),
    getDefaultLibFileName: () => "lib.d.ts",
    writeFile: unimplemented,
    getCurrentDirectory: () => "/",
    getDirectories: () => [],
    getCanonicalFileName: (f) => f.toLowerCase(),
    getNewLine: () => "\n",
    useCaseSensitiveFileNames: () => false,
    readFile: unimplemented,
  };

  const program = ts.createProgram(
    [fileName],
    {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    compilerHost
  );

  const sourceFile = program.getSourceFiles()[0];
  ok(sourceFile);

  const checker = program.getTypeChecker();

  let symbol: ts.Symbol | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) {
      return;
    }

    symbol = checker.getSymbolAtLocation(node.name);
    ok(symbol);
  });

  ok(symbol);
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  return [checker, type, symbol];
}
