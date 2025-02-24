import { PathLike } from "node:fs";
import fs from "node:fs/promises";

const filesystem =  {
    ...fs,
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a dir
    async isDirectory(filePath: PathLike) {
        try {
            const statResult = await fs.stat(filePath)
            return statResult.isDirectory()
        }
        catch {
            return false
        }
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a regular file
    async isFile(filePath: PathLike) {
        try {
            const statResult = await fs.stat(filePath);
            return statResult.isDirectory()
        }
        catch {
            return false
        }
    },
};

export default filesystem