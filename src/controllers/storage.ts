import * as IpfsAPI from "ipfs-api";

// or using options
const ipfs = IpfsAPI({ host: "localhost", port: "5001", protocol: "http" });

/**
 * Get IPFS Object
 * Return JSON
 */
export let getObject = async (id: string) => {
  const data = await ipfs.files.cat(id);
  return JSON.parse(data.toString("utf8"));
};

/**
 * Save IPFS Object
 */
export let saveObject = async (data: Object) => {
  const res = await ipfs.util.addFromStream(new Buffer(JSON.stringify(data), "utf8"));
  const object = res[0];
  console.log(`Saved object at ${object.hash}`);

  // Pin to server
  // TODO: Might want to make this configurable
  ipfs.pin.add(object.hash);

  return object;
};

