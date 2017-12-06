import * as IpfsAPI from "ipfs-api";

// or using options
const ipfs = IpfsAPI({ host: "localhost", port: "5001", protocol: "http" });


/**
 * Get IPFS Object
 * Return JSON
 */
export let getObject = async (id: string) => {
  // Get IPFS object
  const data = await ipfs.files.cat(id);
  console.log("zxcvxzcv");
  ipfs.name.publish(id, (err: string, res: any) => {
    console.log("asdf");
    console.log(res);
  });
  return data.toString("utf8");
};

/**
 * Save IPFS Object
 */
export let saveObject = (id: string) => {
  // sh = shell.NewShell("localhost:5001")
  // fmt.Println("Saving an object to IPFS")
  // hash, err := sh.Add(r)
  // if err != nil {
  // 	fmt.Println("There was an error saving to IPFS. Please make sure `ipfs daemon` is running")
  // 	log.Fatal(err)
  // }
  // fmt.Println(hash)
  // return hash, err
  return "saveObject";
};

