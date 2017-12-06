export as namespace IpfsAPI;
export = ipfsAPI;
declare function ipfsAPI(hostOrMultiaddr: string, port?: string, opts?: any): any;
declare function ipfsAPI(hostOrMultiaddr: any): any;

declare namespace ipfsAPI {
    function version(callback: (err: string, version: string) => void): any;
    function ping(): any;
    function ls(): any;

    export interface bitswap {

    }
    export interface block {

    }
    export interface bootstrap {

    }
    export interface files {
        // ls(directory:string, callback:(error,result) => void);
        // read(file:string, {offset,count}:{offset?:number,count?: number}, callback:(err,stream:NodeJS.ReadableStream) => void);
    }
    export interface dht {

    }
    export interface config {

    }
    export interface log {

    }
    export interface repo {

    }
    export interface swarm {

    }
    export interface refs {

    }
    export interface pin {
        // add()
        // rm();
        // ls();

    }
}


