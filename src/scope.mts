export class AttributeLocal {
  readonly local_name: string;
  readonly attribute_name: string;
  constructor(attribute_name: string, local_name: string) {
    this.attribute_name = attribute_name;
    this.local_name = local_name;
  }

  isShorthand(): boolean {
    return this.attribute_name == this.local_name;
  }
}

/**
 * A list of the object attribute names leading up to the value
 * excuding the target attribute.
 */
export type Path = string[];

export class Scope {
  #by_full_path: Map<string, AttributeLocal>;
  #local_names: Set<string>;
  #type_names: Set<string>;

  constructor() {
    this.#by_full_path = new Map();
    this.#local_names = new Set();
    this.#type_names = new Set();
  }

  /**
   * `path` is a list of attributes leading to the value.
   */
  createAttribute(
    path: Path,
    attribute_name: string
  ): AttributeLocal {
    const key = JSON.stringify([...path, attribute_name]);
    if (this.#by_full_path.has(key)) {
      console.error(this.#by_full_path);
      throw new Error(
        `a local with prefixed name ${key} already exists`
      );
    }

    const desired_local_name = toIdentifier(attribute_name);
    const local_name = this.newLocalName(path, desired_local_name);
    const attr = new AttributeLocal(attribute_name, local_name);
    this.#by_full_path.set(key, attr);
    return attr;
  }

  getByPath(path: Path, name: string): AttributeLocal {
    const key = JSON.stringify([...path, name]);
    const value = this.#by_full_path.get(key);
    if (!value) {
      console.error(this.#by_full_path);
      throw new Error(
        `a local with prefixed name ${key} does not exist`
      );
    }
    return value;
  }

  newLocalName(path: Path, proposal: string): string {
    proposal = toIdentifier(proposal);

    if (!this.#local_names.has(proposal)) {
      this.#local_names.add(proposal);
      return proposal;
    }

    for (let i = 0; i < path.length; i++) {
      const prefixed = [...path.slice(-i - 1), proposal]
        .map(toIdentifier)
        .join("_");
      if (!this.#local_names.has(prefixed)) {
        this.#local_names.add(prefixed);
        return prefixed;
      }
    }

    for (let i = 2; i < 10_000; i++) {
      const name2 = `${proposal}_${i}`;
      if (!this.#local_names.has(name2)) {
        this.#local_names.add(name2);
        return name2;
      }
    }
    throw new Error(
      `too many unique locals of name ${JSON.stringify(proposal)}`
    );
  }

  /**
   * A shameless copy paste of the above.
   */
  newTypeName(path: string[], proposal: string): string {
    proposal = toIdentifier(proposal);

    if (!this.#type_names.has(proposal)) {
      this.#type_names.add(proposal);
      return proposal;
    }

    for (let i = 0; i < path.length; i++) {
      const prefixed = [...path.slice(-i - 1), proposal]
        .map(toIdentifier)
        .join("_");
      if (!this.#type_names.has(prefixed)) {
        this.#type_names.add(prefixed);
        return prefixed;
      }
    }

    for (let i = 2; i < 10_000; i++) {
      const name2 = `${proposal}_${i}`;
      if (!this.#type_names.has(name2)) {
        this.#type_names.add(name2);
        return name2;
      }
    }
    throw new Error(
      `too many unique types of name ${JSON.stringify(proposal)}`
    );
  }

  list(): string[] {
    return [...this.#local_names.values()];
  }
}

/**
 * Converts any string to a safe local identifier.
 * For simplicity it ignores Unicode.
 */
function toIdentifier(name: string): string {
  return name
    .replace(/[^_a-zA-Z0-9]/g, "_")
    .replace(/^([^_a-zA-Z])/, "_$1");
}
