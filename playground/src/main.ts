import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import {
  generateForPlayground,
  explainError,
} from "type-predicate-generator/src";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import "./style.css";
import "./worker";

function $(selector: string) {
  return document.querySelector<HTMLElement>(selector);
}

export function ok(value: unknown): asserts value {
  if (!value) {
    throw new Error(`${value} is not truthy`);
  }
}

function must<T>(v: T | null): T {
  if (!v) {
    throw new Error("must not be null");
  }
  return v;
}

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
  // exactOptionalPropertyTypes: true,
});

const defaultExample = `export type User = {
  id: number;
  login: string;
  bio: {
    first: string;
    last: string;
  };
};

export type Post = {
  title: string;
  text: string;
  link?: string;
  published: boolean;
  author: User;
  list: Array<number | string>;
};
`;

function saveState(source: string) {
  try {
    history.replaceState(
      null,
      "",
      `?s=${compressToEncodedURIComponent(source)}`
    );
  } catch (err) {
    console.error(err);
  }
}

function loadState(): string {
  try {
    const url = new URL(location.href);
    const encoded = url.searchParams.get("s");
    if (encoded) {
      const source = decompressFromEncodedURIComponent(encoded);
      if (source) {
        return source;
      }
    }
  } catch (err) {
    console.error(err);
  }

  return defaultExample;
}

const vitestModel = monaco.editor.createModel(
  `
  export const describe: any = null;
  export const it: any = null;
  export const expect: any = null;
  `,
  "typescript",
  monaco.Uri.file("/vitest.ts")
);

const sourceModel = monaco.editor.createModel(
  loadState(),
  "typescript",
  monaco.Uri.file("/example.ts")
);

const predicateModel = monaco.editor.createModel(
  ``,
  "typescript",
  monaco.Uri.file("/example_guards.ts")
);

const testsModel = monaco.editor.createModel(
  ``,
  "typescript",
  monaco.Uri.file("/example_guards.test.ts")
);

const sourceNode = must($("#source"));
const sourceEditor = monaco.editor.create(sourceNode, {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
});
sourceEditor.setModel(sourceModel);

const predicatesNode = must($("#predicates"));
const predicatesEditor = monaco.editor.create(predicatesNode, {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
});
predicatesEditor.setModel(predicateModel);

const testsNode = must($("#tests"));
const testsEditor = monaco.editor.create(testsNode, {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
});
testsEditor.setModel(testsModel);

function onChange() {
  try {
    const sourceCode = sourceModel.getValue();
    saveState(sourceCode);
    const { predicatesCode, testsCode } = generateForPlayground(
      sourceCode,
      "./example",
      "./example_guards",
      true
    );
    if (predicatesCode) {
      predicatesEditor.setValue(predicatesCode);
    }
    if (testsCode) {
      testsNode.style.display = "";
      testsEditor.setValue(testsCode);
    }
  } catch (err) {
    predicatesEditor.setValue(
      `/*
${explainError(err, true)}*/
`
    );
    testsEditor.setValue("");
    testsNode.style.display = "none";
    throw err;
  }
}

sourceEditor.onDidChangeModelContent(onChange);

onChange();
