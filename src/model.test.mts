import { expect, test } from "vitest";
import { typeToModel, ObjectType, PrimitiveType } from "./model.mts";
import ts from "typescript";
import { unimplemented } from "./helpers.mts";
import { ok } from "assert";

type Compiled = [ts.TypeChecker, ts.Type];

function compile(source: string): Compiled {
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

  let type: ts.Type | null = null;
  ts.forEachChild(sourceFile, (node) => {
    if (!ts.isTypeAliasDeclaration(node)) {
      return;
    }

    const symbol = checker.getSymbolAtLocation(node.name);
    ok(symbol);
    type = checker.getDeclaredTypeOfSymbol(symbol);
  });

  ok(type);
  return [checker, type];
}

test("empty object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
        }
      `)
    )
  ).toEqual(
    new ObjectType({ isOptional: false, aliasName: "X" }, {})
  );
});

test("simple object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: number
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { isOptional: false, aliasName: "X" },
      {
        a: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "number"
        ),
      }
    )
  );
});

test("non nested object", () => {
  expect(
    typeToModel(
      ...compile(`
        type X = {
          a: number
          b: string
          c: boolean
        }
      `)
    )
  ).toEqual(
    new ObjectType(
      { isOptional: false, aliasName: "X" },
      {
        a: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "number"
        ),
        b: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "string"
        ),
        c: new PrimitiveType(
          { isOptional: false, aliasName: undefined },
          "boolean"
        ),
      }
    )
  );
});
