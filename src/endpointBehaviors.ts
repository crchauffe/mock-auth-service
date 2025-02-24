import { EndpointBehavior, EndpointConfig, IssueEndpointConfig } from "./config"
import { RequestHandler, Request } from "express"
import GLOBAL_LOGGER from "./base_tool/logger"


///////////////////////////////////////////////////////////////////////////////
function hoursToSeconds(timespanInHours: number) {
    return timespanInHours * 60 * 60
}


///////////////////////////////////////////////////////////////////////////////
export const returnOk: RequestHandler = async (request, response) => {
    response.status(200).send(undefined)
}


///////////////////////////////////////////////////////////////////////////////
export const returnNotAuthenticated: RequestHandler = async (request, response) => {
    response.status(401).send(undefined)
}


///////////////////////////////////////////////////////////////////////////////
function makeJwtPayload(config: IssueEndpointConfig, defaultExpiryHours: number, request: Request) {
    const iat = new Date().getTime()
    const expiryHours = config.tokenExpiryHours || defaultExpiryHours
    const exp = iat + hoursToSeconds(expiryHours)

    const basePayload = {
        iat: iat,
        exp: exp,
    }

    if(config.usePostBodyForJwtPayload) return { ...basePayload, ...request.body }
    return {...basePayload, ...config.defaultPayload }
}


///////////////////////////////////////////////////////////////////////////////
export function makeIssueBehavior(
    config: IssueEndpointConfig,
    defaultExpiryHours: number,
    secret: string
): RequestHandler {    
    return async (request, response) => {
        const jwtPayload = makeJwtPayload(config, defaultExpiryHours, request);

        await GLOBAL_LOGGER.info("Created JWT payload:  ", jwtPayload);
        
        // TODO: issue the token in the response
        response.status(500).send()
    }
}


///////////////////////////////////////////////////////////////////////////////
export function makeVerifyBehavior(config: EndpointConfig, secret: string): RequestHandler {
    return async (request, response) => {
        const authHeader = request.headers["authorization"]

        await GLOBAL_LOGGER.info("Verifying for auth header:  ", authHeader)

        // TODO: verify the token in the auth header!
        response.status(500).send()
    }
}


///////////////////////////////////////////////////////////////////////////////
export function makeEndpointBehavior(config: EndpointConfig, defaultExpiryHours: number, secret: string) {
    switch(config.behavior) {
        case EndpointBehavior.RETURN_OK:
            return returnOk

        case EndpointBehavior.RETURN_NOT_AUTHENTICATED:
            return returnNotAuthenticated

        case EndpointBehavior.ISSUE:
            return makeIssueBehavior(config as IssueEndpointConfig, defaultExpiryHours, secret)
        
        case EndpointBehavior.VERIFY:
            return makeVerifyBehavior(config, secret)
    }
}