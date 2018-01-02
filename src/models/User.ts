import * as mongoose from "mongoose";
import * as bcrypt from "bcrypt";

const SALT_WORK_FACTOR = 12;

mongoose.connect(process.env.MONGODB_URI);

export interface IUser extends mongoose.Document {
    username: string;
    password: string;
    comparePassword: Function;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByUsername(id: string): Promise<IUser>;
}

const schema = new mongoose.Schema({
  username: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true }
});

schema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt(12);
  const hash = await bcrypt.hash(this.password, salt);

  this.password = hash;
  next();
});

schema.methods.comparePassword = async function (candidatePassword: string) {
  const valid = await bcrypt.compare(candidatePassword, this.password);
  return valid;
};

schema.static("findByUsername", (username: string) => {
  return User.find({ username: username}).lean().exec();
});

export const User = mongoose.model<IUser>("User", schema) as IUserModel;
