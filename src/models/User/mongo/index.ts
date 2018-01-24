import { MongooseUser } from "./mongoose";

export let createUser = async (username: string, password: string, pubKey: string) => {
  const user = new MongooseUser({
    username: username,
    password: password,
    pub_key: pubKey
  });

  return user.save();
};

export let fetchUser = async (username: string) => {
  return await MongooseUser.findOne({ username: username });
};

export let checkPassword = async (username, password: string) => {
  const user = await fetchUser(username);

  if (!user) {
    return false;
  }

  return await user.comparePassword(password);
};

export let deleteUser = async (username: string, password: string) => {
  const user = await fetchUser(username);
  if (!user) {
    return false;
  }

  try {
    return await user.remove();
  } catch (error) {
    console.error(error);
    return false;
  }
};

