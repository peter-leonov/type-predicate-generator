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
