import ts from "typescript";
import { unimplemented } from "./helpers.mts";
import { ok } from "assert";

export function compile(
  source: string
): [ts.TypeChecker, ts.Type, ts.Symbol] {
  const file_name = "/source.ts";
  const file = ts.createSourceFile(
    file_name,
    source,
    ts.ScriptTarget.ESNext
  );

  const sourceFiles = new Map<string, ts.SourceFile>();
  sourceFiles.set(file_name, file);

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
    readFile: (fileName) => {
      return "unimplemented";
    },
  };

  const program = ts.createProgram(
    [file_name],
    {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    },
    compilerHost
  );

  const sourceFile = program.getSourceFiles()[0];
  ok(sourceFile);

  const checker = program.getTypeChecker();

  let type: ts.Type | undefined;
  let symbol: ts.Symbol | undefined;
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) {
      return;
    }

    symbol = checker.getSymbolAtLocation(node.name);
    ok(symbol);
    type = checker.getDeclaredTypeOfSymbol(symbol);
  });

  ok(type);
  ok(symbol);
  return [checker, type, symbol];
}
