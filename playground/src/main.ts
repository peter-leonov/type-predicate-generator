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

function $<T extends Element>(selector: string) {
  return document.querySelector<T>(selector);
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

const defaultExample = `// This is an example set of types,
// play with them or paste your own.

export type User = {
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

const predicatesComment = `// Here go the type predicates
// generated for the types on the left.

`;

const testsComment = `// And below you can find the unit tests
// generated for the predicates on the left.

`;

function saveState(source: string) {
  if (source == defaultExample) {
    return;
  }
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

const editorConfig = {
  theme: "vs-dark",
  minimap: { enabled: false },
  automaticLayout: true,
  scrollBeyondLastLine: false,
  stickyScroll: { enabled: false },
};

const sourceNode = must($<HTMLElement>("#source"));
const sourceEditor = monaco.editor.create(sourceNode, editorConfig);
sourceEditor.setModel(sourceModel);

const predicatesNode = must($<HTMLElement>("#predicates"));
const predicatesEditor = monaco.editor.create(
  predicatesNode,
  editorConfig
);
predicatesEditor.setModel(predicateModel);

const testsNode = must($<HTMLElement>("#tests"));
const testsEditor = monaco.editor.create(testsNode, editorConfig);
testsEditor.setModel(testsModel);

const flagTypesNode = must($<HTMLInputElement>("#flag-types"));

function onChange() {
  const flagTypes = flagTypesNode.checked;
  try {
    const sourceCode = sourceModel.getValue();
    saveState(sourceCode);
    const { predicatesCode, testsCode } = generateForPlayground(
      sourceCode,
      "./example",
      "./example_guards",
      flagTypes
    );
    if (predicatesCode) {
      predicatesEditor.setValue(predicatesComment + predicatesCode);
    }
    if (testsCode) {
      testsNode.style.display = "";
      testsEditor.setValue(testsComment + testsCode);
    } else {
      testsEditor.setValue("");
      testsNode.style.display = "none";
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
flagTypesNode.addEventListener("change", onChange);

onChange();
