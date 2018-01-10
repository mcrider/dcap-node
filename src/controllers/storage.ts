import * as IpfsAPI from "ipfs-api";

// or using options
const ipfs = IpfsAPI({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });

/**
 * Get IPFS Object
 * Return JSON
 */
export let getObject = async (id: string) => {
  const data = await ipfs.files.cat(id);
  const decoded = JSON.parse(data.toString("utf8"));

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
  if (process.env.PIN_OBJECTS === true) {
    ipfs.pin.add(object.hash);
  }

  return object;
};

