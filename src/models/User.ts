import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt";

const SALT_WORK_FACTOR = 12;

mongoose.connect(process.env.MONGODB_URI);

export interface IUser extends mongoose.Document {
    username: string;
    password: string;
    pub_key: string;
    comparePassword: Function;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByUsername(id: string): Promise<IUser>;
}

const schema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  pub_key: { type: String }
});

schema.pre("save", async function (next) {
  // Hash the user's password before saving
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(this.password, salt);

  this.password = hash;
  next();
});

schema.methods.comparePassword = async function (candidatePassword: string) {
  const valid = await bcrypt.compare(candidatePassword, this.password);
  return valid;
};


export const User = mongoose.model<IUser>("User", schema) as IUserModel;
