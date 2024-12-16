type Car = {
  brand: string;
};

type MyUser = {
  optional?: number;
  // either: number | boolean;
  nested: {
    foo: string;
  };
  name: string;
  age: number;
  car: Car;
};
