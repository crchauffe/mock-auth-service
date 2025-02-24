import * as Config from "./config";
import GLOBAL_LOGGER from "./base_tool/logger";
import FsUtils from "./utils/fs";
import BaseTool, { CliArgs, BaseExitCodes, ParseArgsOptionsConfig, ParsedArgOptions } from "./base_tool/base_tool";
import * as Path from "path";
import { PathLike } from "fs";
import { addSecret } from "./base_tool/secret_scrubber";
import PromiseUtils from "./utils/promise"
import * as Express from "express";
import { makeEndpointBehavior } from "./endpointBehaviors";
import { EOL } from "os";


///////////////////////////////////////////////////////////////////////////////
/**
 * The exit codes returned by main
 */
enum MockAuthServiceExitCodes {
  SOME_OTHER_ERROR = 2,
}


//////////////////////////////////////////////////////////////////////////
const DEFAULT_TOKEN_SECRET = "c1961b41ab86697270ce5060d381cbbce720a756968b3f1817ea93714772a866"


//////////////////////////////////////////////////////////////////////////
export type ExitCodes = BaseExitCodes | MockAuthServiceExitCodes
export const ExitCodes = { ...BaseExitCodes, ...MockAuthServiceExitCodes }


//////////////////////////////////////////////////////////////////////////
export type MockAuthServiceCliArgs = CliArgs & {
  configFile?: PathLike
  listeningPort: number,
  tokenSecret: string
  tokenExpiryHours: number,
}


//////////////////////////////////////////////////////////////////////////
export class MockAuthService extends BaseTool<MockAuthServiceCliArgs> {
  

  //////////////////////////////////////////////////////////////////////////
  getCliArgsConfig(): ParseArgsOptionsConfig {
    return {
      config_file: {
        short: "c",
        type: "string",
        default: process.env["CONFIG_FILE"]
      },
      listening_port: {
        short: "p",
        type: "string",
        default: process.env["LISTENING_PORT"] || "80"
      },
      token_secret: {
        short: "s",
        type: "string",
        default: process.env["TOKEN_SECRET"] 
      },
      token_expiry_hours: {
        short: "e",
        type: "string",
        default: process.env["TOKEN_EXPIRY_HOURS"] || "2.5"
      }
    };
  }


  //////////////////////////////////////////////////////////////////////////
  cliArgsFromParsedArgs(parsedArgOptions: ParsedArgOptions): MockAuthServiceCliArgs {

    const listeningPortArg = parsedArgOptions?.["listening_port"];
    const unparsedlisteningPort = typeof listeningPortArg === "string" ? listeningPortArg : process.env["LISTENING_PORT"]
    const parsedListeningPort = unparsedlisteningPort && Number.parseInt(unparsedlisteningPort) || 80

    const configFileArg = parsedArgOptions?.["config_file"];
    const configFile = typeof configFileArg === "string" ? configFileArg : undefined

    const tokenSecretArg = parsedArgOptions?.["token_secret"];
    const tokenSecret = typeof tokenSecretArg === "string" ? tokenSecretArg : process.env["TOKEN_SECRET"] || DEFAULT_TOKEN_SECRET
    addSecret(tokenSecret)

    const expiryHoursArg = parsedArgOptions?.["expiry_hours"];
    const unparsedExpiryHours = typeof expiryHoursArg === "string" ? expiryHoursArg : process.env["TOKEN_EXPIRY_HOURS"]
    const expiryHours = unparsedExpiryHours && Number.parseFloat(unparsedExpiryHours) || 80
    

    // construct CLI args based on the base args and parsed args
    const cliArgs = {
      ...super.cliArgsFromParsedArgs(parsedArgOptions),
      listeningPort:  parsedListeningPort,
      configFile:  configFile,
      tokenSecret: tokenSecret,
      expiryHours: expiryHours
    }

    return cliArgs
  }


  //////////////////////////////////////////////////////////////////////////
  async getConfigFile(cliArgs: MockAuthServiceCliArgs) {
    if (cliArgs.configFile) return cliArgs.configFile;

    const defaultConfigFile = Path.resolve("./config.yml")
    await GLOBAL_LOGGER.warning("Config file not specified, assuming default:  ", defaultConfigFile)
    return defaultConfigFile
  }


  //////////////////////////////////////////////////////////////////////////
  getResourcesDir() {
    return Path.join(__dirname, "resources")
  }


  //////////////////////////////////////////////////////////////////////////
  async makeDefaultConfigFile(configFile: PathLike) {
    const templateConfig = Path.join(this.getResourcesDir(), "config.template.yml") as PathLike
    await FsUtils.copyFile(templateConfig, configFile)
  }


  //////////////////////////////////////////////////////////////////////////
  async registerEndpoint(
    expressApp: Express.Application,
    endpointConfig: Config.EndpointConfig,
    defaultExpiryHours: number,
    tokenSecret: string
  ) {
    if(!endpointConfig.path) {
      await GLOBAL_LOGGER.warning("Skipping endpoint config:  path not specified.  ",
        "Endpoint config:  ", endpointConfig);
      return
    }
    if(!endpointConfig.method) {
      await GLOBAL_LOGGER.warning("Skipping endpoint config:  method not specified (",
        Config.Methods, ").  Endpoint config:  ", endpointConfig);
      return
    }
    if(!endpointConfig.behavior) {
      await GLOBAL_LOGGER.warning("Skipping endpoint config:  behavior not specified (",
        Config.EndpointBehavior, ").  Endpoint config:  ", endpointConfig);
      return
    }

    const handler = makeEndpointBehavior(endpointConfig, defaultExpiryHours, tokenSecret)

    if(endpointConfig.method === Config.Methods.GET) {
      if(handler) return expressApp.get(endpointConfig.path, handler);
    }
    else if(endpointConfig.method === Config.Methods.POST) {
      if(handler) return expressApp.post(endpointConfig.path, handler)
    }

    await GLOBAL_LOGGER.warning("Endpoint NOT configured:  ", endpointConfig);
  }


  //////////////////////////////////////////////////////////////////////////
  async main(cliArgs: MockAuthServiceCliArgs) {
    const configFile = await this.getConfigFile(cliArgs);

    // ensure the config file exists
    if(await FsUtils.isFile(configFile) == false) {
      await GLOBAL_LOGGER.warning("Config file not found.  Copying config template to ", configFile);
      await this.makeDefaultConfigFile(configFile)
    }
    
    await GLOBAL_LOGGER.info("Config file:  ", configFile);

    const config = await Config.loadConfigFromPath(configFile)

    const listenigPort = config.listeningPort || cliArgs.listeningPort
    const tokenExpiryHours = config.tokenExpiryHours || cliArgs.tokenExpiryHours
    const tokenSecret = cliArgs.tokenSecret
    const endpoints = config.endpoints || []

    const expressApp = Express.default()

    // configure the express app with the endpoints
    await PromiseUtils.sequential(...endpoints.map(async (e) => {
      await this.registerEndpoint(expressApp, e, tokenExpiryHours, tokenSecret)
    }))

    // return a promise that never resolves so that main doesn't exit and continues to
    // handle HTTP requests
    return new Promise<number>(async (resolve, reject) => {

      // start listening, reject on error
      expressApp.listen(listenigPort, async (error) => {
        if(error) {
          await GLOBAL_LOGGER.error("Error from HTTP server:  ", error)
        }
      })

      // format endpoints for output
      const endpointMsg = endpoints
      .map(e => ("   " + (e.behavior || "") + ":  ").padEnd(15) + (e.method || "").padEnd(7) +  " http://localhost:" + listenigPort + e.path)
      .join(EOL)

      // print out a pretty message
      await GLOBAL_LOGGER.info("Listening on endpoints:  ", EOL + endpointMsg + EOL)
    })
  }
}


///////////////////////////////////////////////////////////////////////////////
// only execute this block if the module is being executed
if (require.main === module) {
  new MockAuthService().run()
}



