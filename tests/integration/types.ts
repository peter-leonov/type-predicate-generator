export type User = {
  id: number;
  login: string;
  bio: {
    first: string;
    last: string;
  };
};

// export type Post = {
//   title: string;
//   text: string;
//   link?: string;
//   published: boolean;
//   author: User;
//   more: Array<number | string>;
// };
