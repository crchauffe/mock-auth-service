import { parseArgs, ParseArgsConfig } from "util";
import GLOBAL_LOGGER, { DEFAULT_GLOBAL_LOGGER_CONFIG, LogEndpoint, LogLevel, LogLevels, makeConsoleLogEndpoint, makeLogfileLogEndpoint } from "./logger";
import * as Path from "path";


///////////////////////////////////////////////////////////////////////////////
export enum BaseExitCodes {
    SUCCESS = 0,
    GENERAL_ERROR = 1
}


///////////////////////////////////////////////////////////////////////////////
// copy/paste form util module
export interface ParseArgsOptionConfig {
    /**
     * Type of argument.
     */
    type: "string" | "boolean";
    /**
     * Whether this option can be provided multiple times.
     * If `true`, all values will be collected in an array.
     * If `false`, values for the option are last-wins.
     * @default false.
     */
    multiple?: boolean | undefined;
    /**
     * A single character alias for the option.
     */
    short?: string | undefined;
    /**
     * The default option value when it is not set by args.
     * It must be of the same type as the the `type` property.
     * When `multiple` is `true`, it must be an array.
     * @since v18.11.0
     */
    default?: string | boolean | string[] | boolean[] | undefined;
}


///////////////////////////////////////////////////////////////////////////////
// copy/paste from util module
export interface ParseArgsOptionsConfig {
    [longOption: string]: ParseArgsOptionConfig;
}


///////////////////////////////////////////////////////////////////////////////
// values parsed from args
export interface ParsedArgOptions {
    [longOption: string]: undefined | string | boolean | Array<string | boolean>;
}


///////////////////////////////////////////////////////////////////////////////
// values parsed from args
export type CliArgs = {
    log_file?: Path.ParsedPath,
    verbosity: number,
    version: boolean
}


///////////////////////////////////////////////////////////////////////////////
/**
 * Implements a lot of boiler plate logic for:
 *   * parsing environment variables
 *   * parsing the commandline
 *   * setting up a global logger
*/
export default abstract class BaseTool<C extends CliArgs> {

    
    ///////////////////////////////////////////////////////////////////////////////
    abstract getCliArgsConfig(): ParseArgsOptionsConfig
    
    
    ///////////////////////////////////////////////////////////////////////////////
    abstract main(config: C): number | Promise<number>;
    

    ///////////////////////////////////////////////////////////////////////////////
    cliArgsFromParsedArgs(parsedArgOptions: ParsedArgOptions): C {
        // parse log filename
        const unparsedLogFile = parsedArgOptions?.["log_file"] as string
        const logfileStr = typeof unparsedLogFile === "string" && unparsedLogFile || undefined
        const parsedLogfile = logfileStr && Path.parse(Path.resolve(logfileStr)) || undefined

        // parse verbosity
        const verbosity = (parsedArgOptions["verbosity"] as ArrayLike<boolean>)?.length || 0

        // parse version
        const version = parsedArgOptions["version"] as boolean || false

        return {
            log_file: parsedLogfile,
            verbosity: verbosity,
            version: version
        } as C;
    }
    
    
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * @returns The arguments parsed from the CLI
    */
    getParseArgsConfig(): ParseArgsConfig {
        const toolArgs = this.getCliArgsConfig()
        
        // gotta do some weird hacky stuff to set default verbosity
        const default_verbosity_length = Number.parseInt(process.env["VERBOSITY"] || "0")
        const default_verbosity_array = Array<boolean>(default_verbosity_length).fill(true)
        
        return {
            options: {
                log_file:  {type: "string",  short: "l", default: process.env["LOG_FILE"]},
                verbosity: {type: "boolean", short: "V", multiple: true, default: default_verbosity_array},
                version:   {type: "boolean", short: "v", default:  false},
                ...toolArgs    
             },
             strict: true
         } as ParseArgsConfig
    }
    
    
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Converts a verbosity level to a log level
    */
    logLevelFromVerbosity(verbosity?: number) {

        // if verbosity is specified or is not 0...
        if(verbosity) {
            if(verbosity < -1) return LogLevels.ERROR
            if(verbosity < 0) return LogLevels.WARNING
            if(verbosity <= 1) return LogLevels.VERBOSE
            return LogLevels.DEBUG
        }
        
        // if verbosity is specified or is 0...
        return LogLevels.INFO
    }
    
    
    ///////////////////////////////////////////////////////////////////////////////
    /**
     * Initializes the global logger
     * @param consoleVerbosity the verbosity level to show in the CLI
     * @param logfile the file to write the logs to
    */
    async initLogging(consoleVerbosity?: number, logfile?: Path.ParsedPath) {
        
        // convert verbosity to log level
        const consoleLogLevel = this.logLevelFromVerbosity(consoleVerbosity)
        
        const loggingEndpoints: LogEndpoint[] = [makeConsoleLogEndpoint(consoleLogLevel.value)];
        
        if(logfile) {
            // create the log file
            const logfile_endpoint = await makeLogfileLogEndpoint(logfile);
            
            // add it to the list of endpoints
            loggingEndpoints.push(logfile_endpoint);
         }
         
         GLOBAL_LOGGER.setConfig({
             ...DEFAULT_GLOBAL_LOGGER_CONFIG,
             endpoints: loggingEndpoints
         });
    }
    
    
    ///////////////////////////////////////////////////////////////////////////////
    public handleFatalError(fatal: any): never {
        const FATAL: LogLevel = {name: "FATAL", value: Number.MAX_SAFE_INTEGER};
        GLOBAL_LOGGER.log(FATAL, "Fatal error:  ", fatal);
        return process.exit(BaseExitCodes.GENERAL_ERROR)
    }
        
        
    ///////////////////////////////////////////////////////////////////////////////
    async baseMain() {
        // figure out what the CLI arguments are
        const parseArgsConfig = this.getParseArgsConfig()
        const parsedArgs = parseArgs(parseArgsConfig).values;
        const cliArgs = this.cliArgsFromParsedArgs(parsedArgs)

        // set up logging
        await this.initLogging(cliArgs.verbosity, cliArgs.log_file);

        await GLOBAL_LOGGER.verbose("Logging initialized");
        await GLOBAL_LOGGER.debug("Environment variables:  ", process.env);
        await GLOBAL_LOGGER.debug("CLI arguments:  ", cliArgs);

        // call main
        return await this.main(cliArgs);
    }
        
        
    ///////////////////////////////////////////////////////////////////////////////
    public run(): undefined | never {
        let result: number | Promise<number> | undefined = undefined
            
        // call main, handle fatal errors
        try {
            result = this.baseMain()
        }
        catch(err) {
            return this.handleFatalError(err)    
        }

        if(result instanceof Promise) {    
            // main is async
            result.then(value => {
                return process.exit(value);
            })
            .catch(this.handleFatalError);
        }
        else {
            // main is not async, return the result
            return process.exit(result)
        }
    }
}



