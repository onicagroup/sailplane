import {
    APIGatewayProxyEvent as AWS_APIGatewayProxyEvent,
    APIGatewayEvent,
    Context,
    ProxyResult
} from "aws-lambda";

import middy from '@middy/core';
import cors from '@middy/http-cors';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpHeaderNormalizer from '@middy/http-header-normalizer';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import {Logger} from "@sailplane/logger";

const logger = new Logger('lambda-utils');

/**
 * Casted interface for APIGatewayProxyEvents as converted through the middleware
 */
export interface APIGatewayProxyEvent extends AWS_APIGatewayProxyEvent {
    /**
     * HTTP Request body, parsed from a JSON string into an object.
     */
    body: any | null;

    /**
     * HTTP Path Parameters, always defined, never null
     */
    pathParameters: { [name: string]: string };

    /**
     * HTTP URL query string parameters, always defined, never null
     */
    queryStringParameters: { [name: string]: string };
}

/** Define the async version of ProxyHandler */
export type AsyncProxyHandler = (event: APIGatewayProxyEvent, context: Context) => Promise<any>;

/**
 * Middleware to handle any otherwise unhandled exception by logging it and generating
 * an HTTP 500 response.
 *
 * Fine tuned to work better than the Middy version.
 */
export const unhandledExceptionMiddleware = () => ({
    onError: (handler: middy.HandlerLambda<APIGatewayEvent, ProxyResult>, next: middy.NextFunction) => {

        logger.error('Unhandled exception:', handler.error);

        handler.response = handler.response || {} as ProxyResult;
        if ((handler.response.statusCode || 0) < 400) {
            // @ts-ignore
            handler.response.statusCode = handler.error.statusCode ? handler.error.statusCode : 500;
            handler.response.body = handler.error.toString();
        }

        logger.infoObject("Response to API Gateway: ", handler.response);
        next();
    }
});

/**
 * Middleware to allow an async handler to return its exact response body.
 * This middleware will wrap it up as an APIGatewayProxyResult.
 * Must be registered as the last (thus first to run) "after" middleware.
 */
export const resolvedPromiseIsSuccessMiddleware = () => ({
    after: (handler: middy.HandlerLambda<APIGatewayEvent, ProxyResult>, next: middy.NextFunction) => {
        // If response isn't a proper API result object, convert it into one.
        let r = handler.response;
        if (!r || typeof r !== 'object' || (!r.statusCode && !r.body)) {
            handler.response = {
                statusCode: 200,
                body: r ? JSON.stringify(r) : ''
            };
        }

        next();
    }
});

/**
 * Wrap an API Gateway proxy lambda function handler to add features:
 * - Set CORS headers.
 * - Normalize incoming headers to lowercase
 * - If incoming content is JSON text, replace event.body with parsed object.
 * - Ensures that event.queryStringParameters and event.pathParameters are defined,
 *   to avoid TypeErrors.
 * - Ensures that handler response is formatted properly as a successful
 *   API Gateway result.
 * - Catch http-errors exceptions into proper HTTP responses.
 * - Catch other exceptions and return as HTTP 500
 *
 * This wrapper includes commonly useful middleware. You may further wrap it
 * with your own function that adds additional middleware, or just use it as
 * an example.
 *
 * @param handler async function to wrap
 * @see https://middy.js.org/docs/middlewares.html
 * @see https://www.npmjs.com/package/http-errors
 */
export function wrapApiHandler(handler: AsyncProxyHandler): middy.Middy<AWS_APIGatewayProxyEvent, ProxyResult> {
    return middy(handler)
        .use(httpEventNormalizer()).use(httpHeaderNormalizer()).use(httpJsonBodyParser())
        .use(cors())
        .use(resolvedPromiseIsSuccessMiddleware())
        .use(unhandledExceptionMiddleware());
}

/**
 * Construct the object that API Gateway wants back upon a successful run. (HTTP 200 Ok)
 *
 * This normally is not needed. If the response is simply the content to return as the
 * body of the HTTP response, you may simply return it from the handler given to
 * #wrapApiHandler(handler). It will automatically transform the result.
 *
 * @param result object to serialize into JSON as the response body
 * @returns {ProxyResult}
 */
export function apiSuccess(result?: any): ProxyResult {
    return {
        statusCode: 200,
        body: result ? JSON.stringify(result) : ''
    };
}

/**
 * Construct the object that API Gateway wants back upon a failed run.
 *
 * Often, it is simpler to throw an http-errors exception from your #wrapApiHandler
 * handler.
 *
 * @see https://www.npmjs.com/package/http-errors
 * @param statusCode HTTP status code, between 400 and 599.
 * @param message string to return in the response body
 * @returns {ProxyResult}
 */
export function apiFailure(statusCode: number, message?: string): ProxyResult {
    const response: ProxyResult = {
        statusCode,
        body: message || ''
    };

    logger.warnObject("Response to API Gateway: ", response);
    return response;
}
