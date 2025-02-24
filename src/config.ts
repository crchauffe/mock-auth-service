import { PathLike } from "fs";
import FsUtils from "./utils/fs";
import * as yaml from 'yaml'
import GLOBAL_LOGGER from "./base_tool/logger";
import { EOL } from "os";


///////////////////////////////////////////////////////////////////////////////
export enum EndpointBehavior {
    ISSUE = "ISSUE",
    VERIFY = "VERIFY",
    RETURN_OK = "RETURN_OK",
    RETURN_NOT_AUTHENTICATED = "RETURN_NOT_AUTHENTICATED",
}


///////////////////////////////////////////////////////////////////////////////
export enum Methods {
    GET = "GET",
    POST = "POST"
}


///////////////////////////////////////////////////////////////////////////////
export interface EndpointConfig {
    path?: string
    method?: Methods
    behavior?:  EndpointBehavior
}


///////////////////////////////////////////////////////////////////////////////
export type IssueEndpointConfig = EndpointConfig & {
    behavior:  EndpointBehavior.ISSUE
    tokenExpiryHours?: number
    usePostBodyForJwtPayload?: boolean
    defaultPayload?: any
}


///////////////////////////////////////////////////////////////////////////////
export interface Config {
    listeningPort?: number
    tokenExpiryHours?: number
    defaultPayload?: any
    endpoints?:  EndpointConfig[]
}


///////////////////////////////////////////////////////////////////////////////
export const DEFAULT_CONFIG_FILE_LOCATION = "config.yml"


///////////////////////////////////////////////////////////////////////////////
export const loadConfigFromString = (value: string)  => {
    return yaml.parse(value) as Config
}


///////////////////////////////////////////////////////////////////////////////
export const loadConfigFromPath = async (path: PathLike = DEFAULT_CONFIG_FILE_LOCATION) => {
    const value = await FsUtils.readFile(path)
    const message = "Loaded yaml config from " + path + EOL +
    "=".repeat(30) + "LOADED CONFIG" + "=".repeat(30) + EOL +
    value + EOL +
    "=".repeat(60 + "LOADED CONFIG".length)
    await GLOBAL_LOGGER.debug(message)
    return loadConfigFromString(value.toString("utf-8"));
}


///////////////////////////////////////////////////////////////////////////////
export const saveConfigToString = async (value: Config) => {
    return yaml.stringify(value)
}


