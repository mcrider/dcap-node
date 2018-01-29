/**
 * Get IPFS Object
 * Return JSON
 */
export let getDocument = async (id: string) => {
  try {
    const data = await global.ipfsd.api.cat(id);
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
  const res = await global.ipfsd.api.util.addFromStream(new Buffer(JSON.stringify(data), "utf8"));
  const document = res[0];

  // Pin to server
  if (process.env.PIN_DOCUMENTS === true) {
    global.ipfsd.api.pin.add(document.hash);
  }

  return document;
};

