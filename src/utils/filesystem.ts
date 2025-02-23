import fs, { appendFile } from "node:fs";

const filesystem =  {
    ...fs,
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a dir
    async isDirectory(filePath: fs.PathLike) {
        return new Promise<boolean>((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if(err) reject(err);
                resolve(stats && stats.isDirectory())
            });
        });
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a regular file
    async isFile(filePath: fs.PathLike) {
        return new Promise<boolean>((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if(err) resolve(false);
                resolve(stats && stats.isFile())
            });
        });
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // wrap fs.readFile with an async function
    async readFileAsync(filePath: fs.PathOrFileDescriptor) {
        return new Promise<Buffer<ArrayBufferLike>>((resolve, reject) => {
            fs.readFile(filePath, (err, data) => {
                if(err) reject(err);
                resolve(data);
            } )
        });
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // wrap fs.readFile with an async function
    async mkdirAsync(filePath: fs.PathLike, options?: fs.MakeDirectoryOptions & { recursive: true }) {
        return new Promise<void>((resolve, reject) => {
            if(options) {
                fs.mkdir(filePath, options, (err, path) => {
                    if(err) reject(err);
                    resolve();
                } )
            }
            else {
                fs.mkdir(filePath, (err) => {
                    if(err) reject(err);
                    resolve();
                } )
            }
        });
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // wrap fs.writeFile with an async function
    async writeFileAsync(
        filePath: fs.PathOrFileDescriptor,
        data: string | NodeJS.ArrayBufferView,
        options?: fs.WriteFileOptions) {
        
        return new Promise<void>((resolve, reject) => {

            if(options) {
                fs.writeFile(filePath, data, options, () => {
                    resolve();
                })
            }
            else {
                fs.writeFile(filePath, data, () => {
                    resolve();
                })
            }
        });
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // wrap fs.appendFile with an async function
    async appendFileAsync(
        filePath: fs.PathOrFileDescriptor,
        data: string | Uint8Array,
        options?: fs.WriteFileOptions
    ) {
        return new Promise<void>((resolve) => {
            if(options) {
                fs.appendFile(filePath, data, options, () => {
                    resolve();
                });
            }
            else {
                fs.appendFile(filePath, data, () => {
                    resolve();
                });
            }
        })
    },
};

export default filesystem