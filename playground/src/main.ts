import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { generateTypeGuards } from "type-predicate-generator/src";
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

monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
  strict: true,
  noImplicitAny: true,
  strictNullChecks: true,
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

const sourceRoot = $("#source");
ok(sourceRoot);
const source = monaco.editor.create(sourceRoot, {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
});
source.setModel(sourceModel);

const predicatesRoot = $("#predicates");
ok(predicatesRoot);
const predicates = monaco.editor.create(predicatesRoot, {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
});
predicates.setModel(predicateModel);

function onChange() {
  try {
    const sourceCode = sourceModel.getValue();
    saveState(sourceCode);
    predicates.setValue(generateTypeGuards(sourceCode));
  } catch (err) {
    predicates.setValue(
      `// Compilation failed:
//    ${err}
// Please see the full error message,
// stacktrace and more context in the browser console.
`
    );
    throw err;
  }
}

source.onDidChangeModelContent(onChange);

onChange();
