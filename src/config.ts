import { PathLike } from "fs";
import filesystem from "./utils/filesystem";
import * as yaml from 'yaml'
import { config } from "process";


///////////////////////////////////////////////////////////////////////////////
export interface EndpointConfig {
    method?: "GET" | "POST"
    path?: string
}


///////////////////////////////////////////////////////////////////////////////
export interface Config {
    listeningPort?: number
    tokenExpiryHours?: number
    defaultPayload?: any
    issueEndpoint?: EndpointConfig
    verifyEndpoint?: EndpointConfig
}


///////////////////////////////////////////////////////////////////////////////
export const DEFAULT_CONFIG_FILE_LOCATION = "config.yml"


///////////////////////////////////////////////////////////////////////////////
export const loadConfigFromString = (value: string)  => {
    return yaml.parse(value) as Config
}


///////////////////////////////////////////////////////////////////////////////
export const loadConfigFromPath = async (path: PathLike = DEFAULT_CONFIG_FILE_LOCATION) => {
    const value = await filesystem.readFile(path)
    return loadConfigFromString(value.toString("utf-8"));
}


///////////////////////////////////////////////////////////////////////////////
export const saveConfigToString = async (value: Config) => {
    return yaml.stringify(config, {  })
}


