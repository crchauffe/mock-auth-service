import { isNumberObject } from "util/types";
import * as Config from "./config";
import GLOBAL_LOGGER, { DEFAULT_CONSOLE_LOG_ENDPOINT, DEFAULT_GLOBAL_LOGGER_CONFIG, LogEndpoint, LogLevels, makeConsoleLogEndpoint, makeLogfileLogEndpoint } from "./base_tool/logger";
import filesystem from "./utils/filesystem";
import { parseArgs, ParseArgsConfig } from "util";
import BaseTool, { CliArgs, BaseExitCodes, ParseArgsOptionsConfig, ParsedArgOptions } from "./base_tool/base_tool";
import * as Path from "path";


///////////////////////////////////////////////////////////////////////////////
/**
 * The exit codes returned by main
 */
enum MockAuthServiceExitCodes {
  SOME_OTHER_ERROR = 2,
}


//////////////////////////////////////////////////////////////////////////
export type ExitCodes = BaseExitCodes | MockAuthServiceExitCodes
export const ExitCodes = { ...BaseExitCodes, ...MockAuthServiceExitCodes }


//////////////////////////////////////////////////////////////////////////
export type MockAuthServiceCliArgs = CliArgs & {
  listeningPort: number,
  configFile?: Path.ParsedPath
}


//////////////////////////////////////////////////////////////////////////
export class MockAuthService extends BaseTool<MockAuthServiceCliArgs> {
  

  //////////////////////////////////////////////////////////////////////////
  getCliArgsConfig(): ParseArgsOptionsConfig {
    return {
      listening_port: {
        short: "p",
        type: "string",
        default: process.env["LISTENING_PORT"] || "80"
      },
      config_file: {
        short: "c",
        type: "string",
        default: process.env["CONFIG_FILE"] || "config.yml"
      }
    };
  }


  //////////////////////////////////////////////////////////////////////////
  cliArgsFromParsedArgs(parsedArgOptions: ParsedArgOptions): MockAuthServiceCliArgs {

    const listeningPortArg = parsedArgOptions?.["listening_port"];
    const unparsedlisteningPort = typeof listeningPortArg === "string" ? listeningPortArg : process.env["LISTENING_PORT"]
    const parsedListeningPort = unparsedlisteningPort && Number.parseInt(unparsedlisteningPort) || 80

    const configFileArg = parsedArgOptions?.["config_file"];
    const unparsedConfigFile = typeof configFileArg === "string" ? configFileArg : undefined
    const parsedConfigFile = unparsedConfigFile && Path.parse(unparsedConfigFile) || Path.parse(Path.resolve("config.yml"))
    

    // construct CLI args based on the base args and parsed args
    const cliArgs = {
      ...super.cliArgsFromParsedArgs(parsedArgOptions),
      listeningPort:  parsedListeningPort,
      configFile:  parsedConfigFile
    }

    return cliArgs
  }


  //////////////////////////////////////////////////////////////////////////
  async main(cliArgs: MockAuthServiceCliArgs) {
    await GLOBAL_LOGGER.info("Hello world!")
    await GLOBAL_LOGGER.info("Listening port:  ", cliArgs.listeningPort);
    await GLOBAL_LOGGER.info("Config file:  ", cliArgs.configFile);

    return ExitCodes.SUCCESS
  }
}


///////////////////////////////////////////////////////////////////////////////
// only execute this block if the module is being executed
if (require.main === module) {
  new MockAuthService().run()
}



