interface TypeSchema {
  title: string;
  hash?: string;
  description?: string;
  fields: Array<Object>;
}


export default class Type {
  private _schema: TypeSchema;

  constructor(schema: TypeSchema) {
    if (!schema.title) {
      throw new SyntaxError("Type schema must have a title attribute");
    }

    this._schema = schema;
  }

  get schema() {
    return this._schema;
  }

  get title() {
    return this._schema.title;
  }

  get hash() {
    return this._schema.hash;
  }

  set hash(hash: string) {
    this._schema.hash = hash;
  }
}
