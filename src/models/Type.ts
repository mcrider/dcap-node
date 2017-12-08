interface TypeSchema {
  name: string;
  hash?: string;
  description?: string;
  fields: Array<Object>;
}


export default class Type {
  private _schema: TypeSchema;

  constructor(schema: TypeSchema) {
    if (!schema.name) {
      throw new TypeError("Type schema must have a name attribute");
    }

    // TODO: If hash doesn't exist, save to IPFS and save hash to file
    this._schema = schema;
  }

  get schema() {
    return this._schema;
  }

  get name() {
    return this._schema.name;
  }

  get hash() {
    return this._schema.hash;
  }

  set hash(hash: string) {
    this._schema.hash = hash;
  }
}
