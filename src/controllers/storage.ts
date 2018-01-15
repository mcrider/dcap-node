import * as IpfsAPI from "ipfs-api";

// or using options
const ipfs = IpfsAPI({ host: process.env.IPFS_HOST, port: process.env.IPFS_PORT, protocol: process.env.IPFS_PROTOCOL });

/**
 * Get IPFS Object
 * Return JSON
 */
export let getDocument = async (id: string) => {
  try {
    const data = await ipfs.files.cat(id);
    const decoded = JSON.parse(data.toString("utf8"));

    return JSON.parse(data.toString("utf8"));
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Save IPFS Object
 */
export let saveDocument = async (data: Object) => {
  const res = await ipfs.util.addFromStream(new Buffer(JSON.stringify(data), "utf8"));
  const document = res[0];

  // Pin to server
  if (process.env.PIN_DOCUMENTS === true) {
    ipfs.pin.add(document.hash);
  }

  return document;
};

