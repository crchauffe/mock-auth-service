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
}


//////////////////////////////////////////////////////////////////////////
export class MockAuthService extends BaseTool<MockAuthServiceCliArgs> {
  

  //////////////////////////////////////////////////////////////////////////
  getCliArgsConfig(): ParseArgsOptionsConfig {
    return {
    };
  }


  //////////////////////////////////////////////////////////////////////////
  cliArgsFromParsedArgs(parsedArgOptions: ParsedArgOptions): MockAuthServiceCliArgs {

    // construct CLI args based on the base args and parsed args
    const cliArgs = {
      ...super.cliArgsFromParsedArgs(parsedArgOptions),
    }

    return cliArgs
  }


  //////////////////////////////////////////////////////////////////////////
  async main(cliArgs: MockAuthServiceCliArgs) {
    await GLOBAL_LOGGER.info("Hello world!")

    return ExitCodes.SUCCESS
  }
}


///////////////////////////////////////////////////////////////////////////////
// only execute this block if the module is being executed
if (require.main === module) {
  new MockAuthService().run()
}



