import ts, { factory } from "typescript";
import { typeToModel } from "./model";
import { TypeGuardGenerator } from "./generator";
import { assert, unimplemented } from "./helpers";

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

export function generateTypeGuards(
  source: string,
  importFrom = "./example"
): string {
  const fileName = "/source.ts";

  const files = new Map<string, string>();
  files.set(fileName, source);

  const libFileName = "/lib/lib.d.ts";
  files.set(libFileName, libFileContent);

  const compilerHost: ts.CompilerHost = {
    fileExists: (fileName) => files.has(fileName),
    getSourceFile: (fileName, options) => {
      const content = files.get(fileName);
      assert(content != undefined, "source files cannot be missing");
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
      "ts.getPreEmitDiagnostics() found some issues listed in the console"
    );
  }

  const sourceFile = program.getSourceFiles()[1];
  assert(
    sourceFile,
    "the program must have 2 source files, one for the lib and one for the actual test code"
  );

  // Get the checker, we will use it to find more about classes
  let checker = program.getTypeChecker();

  const generator = new TypeGuardGenerator();

  // Walk the tree to search for types
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) {
      return;
    }

    let symbol = checker.getSymbolAtLocation(node.name);
    ok(symbol);
    const model = typeToModel(
      checker,
      checker.getDeclaredTypeOfSymbol(symbol),
      symbol
    );

    generator.addRootTypeGuardFor(model);
  });

  const resultFile = factory.updateSourceFile(
    ts.createSourceFile(
      `example_guards.ts`,
      "",
      ts.ScriptTarget.Latest,
      /*setParentNodes*/ false,
      ts.ScriptKind.TS
    ),
    generator.getFullFileBody(importFrom)
  );

  const printer = ts.createPrinter({
    newLine: ts.NewLineKind.LineFeed,
  });

  return printer.printFile(resultFile);
}
