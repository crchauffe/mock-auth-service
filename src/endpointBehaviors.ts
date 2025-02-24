import { EndpointBehavior, EndpointConfig, IssueEndpointConfig } from "./config"
import { RequestHandler, Request, Response } from "express"
import GLOBAL_LOGGER from "./base_tool/logger"
import * as JWT from "jsonwebtoken"


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
    const iat = Math.floor(new Date().getTime() / 1000)
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

        const token = JWT.sign(jwtPayload, secret)

        await GLOBAL_LOGGER.info("Issued JWT:  ", token);
        
        response.status(200).send(token)
    }
}


///////////////////////////////////////////////////////////////////////////////
export async function decodeBehavior(request: Request, response: Response) {
    const authHeader = request.headers["authorization"]

    await GLOBAL_LOGGER.info("Decoding for auth header:  ", authHeader)

    const token = authHeader?.substring("Bearer ".length)

    try {
        if(token) {
            const payload = JWT.decode(token)
            await GLOBAL_LOGGER.info("Decoded JWT payload:  ", payload)
            response.status(200).send(payload)
            return;
        }
    }
    catch(error) {
        const message = `Error while decoding token:   ${error}`
        await GLOBAL_LOGGER.info(message, error)
        response.status(401).send(message);
        return;
    }

    response.status(400).send("Bad token")
    return;
}



///////////////////////////////////////////////////////////////////////////////
export function makeVerifyBehavior(secret: string): RequestHandler {
    return async (request, response) => {
        const authHeader = request.headers["authorization"]

        await GLOBAL_LOGGER.info("Verifying for auth header:  ", authHeader)

        const token = authHeader?.substring("Bearer ".length)

        try {
            if(token) {
                const payload = JWT.verify(token, secret)
                await GLOBAL_LOGGER.info("Verified JWT payload:  ", payload)
                response.status(200).send(payload)
                return;
            }
        }
        catch(error) {
            const message = `Error while verifying token:   ${error}`
            await GLOBAL_LOGGER.info(message, error)
            response.status(401).send(message);
            return;
        }

        response.status(400).send("Bad token")
        return;
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
        
        case EndpointBehavior.DECODE:
            return decodeBehavior

        case EndpointBehavior.VERIFY:
            return makeVerifyBehavior(secret)
    }
}