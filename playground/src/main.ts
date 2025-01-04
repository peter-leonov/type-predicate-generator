import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
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

const sourceRoot = $("#source");
ok(sourceRoot);

const example = `export type User = {
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

const editor = monaco.editor.create(sourceRoot, {
  theme: "vs-dark",
  minimap: { enabled: false },
  value: example,
  language: "typescript",
});

editor.onDidChangeModelContent(() => {
  console.log("!!!!!!!!!!!!HERE!!!!!!!!!!!!!!!");
  console.log(editor.getValue());
});
