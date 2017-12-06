interface TypeSchema {
  name: string;
  address?: string;
  description?: string;
  fields: Array<Object>;
}


export default class Type {
  private _schema: TypeSchema;

  constructor(schema: TypeSchema) {
    if (!schema.name) {
      throw new TypeError("Type schema must have a name attribute");
    }

    // TODO: If address doesn't exist, save to IPFS and save address to file
    this._schema = schema;
  }

  get schema() {
    return this._schema;
  }

  get name() {
    return this._schema.name;
  }

  get address() {
    return this._schema.address;
  }

  set address(address: string) {
    this._schema.address = address;
  }
}
