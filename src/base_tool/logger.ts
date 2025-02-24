import * as Path from "path";
import filesystem from "../utils/filesystem";
import { EOL } from "os";


///////////////////////////////////////////////////////////////////////////////
export interface LogLevel {name: string, value: number};
export class LogLevels {
    static readonly DEBUG:     LogLevel = { name: "DEBUG",    value: 10 };
    static readonly VERBOSE:   LogLevel = { name: "VERBOSE",  value: 20 };
    static readonly INFO:      LogLevel = { name: "INFO",     value: 30 };
    static readonly WARNING:   LogLevel = { name: "WARNING",  value: 40 };
    static readonly ERROR:     LogLevel = { name: "ERROR",    value: 50 };
    static readonly CRITICAL:  LogLevel = { name: "CRITICAL", value: 60 };
}


///////////////////////////////////////////////////////////////////////////////
export type LogEndpoint = (logLevel: LogLevel, header: string, ...args: any) => Promise<void> | void;


///////////////////////////////////////////////////////////////////////////////
// convert from any to a string
function anyToString(a: any) {
    if(typeof a === "string") return a
    return JSON.stringify(a, null, 4)
}


///////////////////////////////////////////////////////////////////////////////
function formatMessage(...args: any) {
    return args.map(anyToString).reduce((p: any, c: any) => p + c)
}


///////////////////////////////////////////////////////////////////////////////
export async function makeLogfileLogEndpoint(
    path: Path.ParsedPath,
    prependDate: boolean = true,
    minLogLevelValue: number = Number.MIN_SAFE_INTEGER,
    maxLogLevelValue: number = Number.MAX_SAFE_INTEGER) {
    
    let formattedPath = Path.format(path)
    
    // ensure not to overwrite the previous logfile
    if(await filesystem.isFile(Path.format(path))) {
        let dateStr = new Date().toISOString()
        dateStr = dateStr.split(":").join("_")
        dateStr = dateStr.split(".").join("_")

        path.name += "__" + dateStr
        path.base = path.name + path.ext
        formattedPath = Path.format(path)
    }

    // create the logfile
    await filesystem.mkdir(path.dir, { recursive: true })
    await filesystem.writeFile(formattedPath, "");
    
    // ensure logfile was created
    if(await filesystem.isFile(formattedPath) == false) {
        throw new Error(`Not a file:  ${path}`)
    }
    
    // return endpoint handler
    return async (level: LogLevel, header: string, ...args: any) => {
        if(minLogLevelValue <= level.value && level.value <= maxLogLevelValue) {

            // construct message to write to file
            let message = ""
            if(prependDate) {
                let dateStr = new Date().toISOString()
                message += `[${dateStr}]  `
            }

            message += header
            message += formatMessage(...args)
            message += EOL
            
            // append message to file
            await filesystem.appendFile(formattedPath, message)
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
export function makeConsoleLogEndpoint(
    minLogLevelValue: number = Number.MIN_SAFE_INTEGER,
    maxLogLevelValue: number = Number.MAX_SAFE_INTEGER) {
    
    return (level: LogLevel, header: string, ...args: any[]) => {
        if(minLogLevelValue <= level.value && level.value <= maxLogLevelValue) {
            // determine whether to log to stdout or stderr
            if(level.value >= LogLevels.WARNING.value) {
                console.error(header, ...args)
            }
            else console.log(header, ...args)
        }
    }
}


///////////////////////////////////////////////////////////////////////////////
export const DEFAULT_CONSOLE_LOG_ENDPOINT: LogEndpoint = makeConsoleLogEndpoint(LogLevels.INFO.value);


///////////////////////////////////////////////////////////////////////////////
export interface LoggerConfig {
    source: string
    endpoints: LogEndpoint[]
}


///////////////////////////////////////////////////////////////////////////////
export const DEFAULT_GLOBAL_LOGGER_CONFIG: LoggerConfig = {
    source: "global",
    endpoints: [DEFAULT_CONSOLE_LOG_ENDPOINT]
}


///////////////////////////////////////////////////////////////////////////////
export class Logger {
    config: LoggerConfig


    ///////////////////////////////////////////////////////////////////////////////
    constructor(config: LoggerConfig) {
        this.config = config
    }


    ///////////////////////////////////////////////////////////////////////////////
    getConfig() {
        return this.config
    }


    ///////////////////////////////////////////////////////////////////////////////
    setConfig(config: LoggerConfig) {
        this.config = config
    }


    ///////////////////////////////////////////////////////////////////////////////
    // figure out header for the log level
    getHeader(level: LogLevel) {
        return `[${level.name.padEnd(7)}]  [${this.config.source.padEnd(7)}]:  `;
    }


    ///////////////////////////////////////////////////////////////////////////////
    // main logging method
    async log(level: LogLevel, ...args: any[]) {
        // get header
        const header = this.getHeader(level);

        // invoke all the endpoints and return the result
        return Promise.all(this.config.endpoints.map(endpoint => endpoint(level, header, ...args)))
    }
    
    
    ///////////////////////////////////////////////////////////////////////////////
    // convience methods:
    async debug(   ...args: any[]) { return this.log(LogLevels.DEBUG,    ...args); }
    async verbose( ...args: any[]) { return this.log(LogLevels.VERBOSE,  ...args); }
    async info(    ...args: any[]) { return this.log(LogLevels.INFO,     ...args); }
    async warning( ...args: any[]) { return this.log(LogLevels.WARNING,  ...args); }
    async error(   ...args: any[]) { return this.log(LogLevels.ERROR,    ...args); }
    async critical(...args: any[]) { return this.log(LogLevels.CRITICAL, ...args); }
}


///////////////////////////////////////////////////////////////////////////////
const GLOBAL_LOGGER = new Logger(DEFAULT_GLOBAL_LOGGER_CONFIG);
export default GLOBAL_LOGGER;
