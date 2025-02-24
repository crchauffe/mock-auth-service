import { PathLike } from "node:fs";
import fs from "node:fs/promises";
import GLOBAL_LOGGER from "../base_tool/logger";

const FsUtils =  {
    ...fs,
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a dir
    async isDirectory(filePath: PathLike) {
        try {
            const statResult = await fs.stat(filePath)
            return statResult.isDirectory()
        }
        catch (err) {
            await GLOBAL_LOGGER.debug("Exception while determining if dir exists:  ", err);
            return false
        }
    },
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // return true if path is a regular file
    async isFile(filePath: PathLike) {

        try {
            const statResult = await fs.stat(filePath);
            return statResult.isFile()
        }
        catch(err) {
            await GLOBAL_LOGGER.debug("Exception while determining if file exists:  ", err);
            return false
        }
    },
};

export default FsUtils