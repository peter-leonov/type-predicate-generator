export type User = {
  id: number;
  login: string;
  email?: string;
  address: {
    street: string;
    house: number;
  };
};
