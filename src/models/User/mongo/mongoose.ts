import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt";

const SALT_WORK_FACTOR = 12;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, (err) => {
    if (err) {
      throw err;
    }
  });
}

export interface IMongooseUser extends mongoose.Document {
    username: string;
    password: string;
    pub_key: string;
    comparePassword: Function;
}

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    index: { unique: true }
  },
  password: {
    type: String,
    required: true
  },
  pub_key: {
    type: String
  }
});

schema.pre("save", async function (next) {
  // Hash the user's password before saving
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(this.password, salt);

  this.password = hash;
  next();
});

schema.methods.comparePassword = async function (candidatePassword: string) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const MongooseUser = mongoose.model<IMongooseUser>("Users", schema);
