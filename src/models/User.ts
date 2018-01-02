import * as mongoose from "mongoose";

mongoose.connect(process.env.MONGODB_URI);

export interface IUser extends mongoose.Document {
    username: string;
    password: string;
}

export interface IUserModel extends mongoose.Model<IUser> {
  findByUsername(id: string): Promise<IUser>;
}

const schema = new mongoose.Schema({
  username: { type: String, required: true },
  password: { type: String, required: true }
});

schema.static("findByUsername", (username: string) => {
  return User.find({ username: username}).lean().exec();
});

export const User = mongoose.model<IUser>("User", schema) as IUserModel;
