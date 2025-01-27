import { ExternalType } from "./external_types";

export { type ExternalType };

export type User = {
  id: number;
  login: string;
  bio: {
    first: string;
    last: string;
  };
  external: ExternalType;
};

export type Post = {
  title: string;
  text: string;
  link?: string;
  published: boolean;
  author: User;
  more: Array<number | string>;
};

export type HugeOnCombinations = {
  a?: string;
  b?: string;
  c?: string;
  d?: string;
  e?: string;
  f?: string;
  g?: string;
  h?: string;
  i?: string;
  j?: string;
  k?: string;
  l?: string;
  m?: string;
  n?: string;
  o?: string;
  p?: string;
  q?: string;
};
