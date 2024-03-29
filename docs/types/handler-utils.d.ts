import { APIGatewayProxyResult } from "aws-lambda";
import { AsyncMiddyifedHandlerV1, AsyncMiddyifedHandlerV2, AsyncProxyHandlerV1, AsyncProxyHandlerV2 } from "./types";
/**
 * Wrap an API Gateway V1 format proxy lambda function handler to add features:
 * - Set CORS headers.
 * - Normalize incoming headers to lowercase
 * - If incoming content is JSON text, replace event.body with parsed object.
 * - Ensures that event.queryStringParameters and event.pathParameters are defined,
 *   to avoid TypeErrors.
 * - Ensures that handler response is formatted properly as a successful
 *   API Gateway result.
 * - Catch http-errors exceptions into proper HTTP responses.
 * - Catch other exceptions and return as HTTP 500
 * - Set Lambda invocation and API request context in @sailplane/logger
 *
 * This wrapper includes commonly useful middleware. You may further wrap it
 * with your own function that adds additional middleware, or just use it as
 * an example.
 *
 * @param handler async function to wrap
 * @see https://middy.js.org/#:~:text=available%20middlewares
 * @see https://www.npmjs.com/package/http-errors
 */
export declare function wrapApiHandler(handler: AsyncProxyHandlerV1): AsyncMiddyifedHandlerV1;
export declare const wrapApiHandlerV1: typeof wrapApiHandler;
/**
 * Wrap an API Gateway V2 format proxy lambda function handler to add features:
 * - Set CORS headers.
 * - Normalize incoming headers to lowercase
 * - If incoming content is JSON text, replace event.body with parsed object.
 * - Ensures that event.queryStringParameters and event.pathParameters are defined,
 *   to avoid TypeErrors.
 * - Ensures that handler response is formatted properly as a successful
 *   API Gateway result.
 * - Catch http-errors exceptions into proper HTTP responses.
 * - Catch other exceptions and return as HTTP 500
 * - Set Lambda invocation and API request context in @sailplane/logger
 *
 * This wrapper includes commonly useful middleware. You may further wrap it
 * with your own function that adds additional middleware, or just use it as
 * an example.
 *
 * @param handler async function to wrap
 * @see https://middy.js.org/#:~:text=available%20middlewares
 * @see https://www.npmjs.com/package/http-errors
 */
export declare function wrapApiHandlerV2(handler: AsyncProxyHandlerV2): AsyncMiddyifedHandlerV2;
/**
 * Construct the object that API Gateway payload format v1 wants back
 * upon a successful run. (HTTP 200 Ok)
 *
 * This normally is not needed. If the response is simply the content to return as the
 * body of the HTTP response, you may simply return it from the handler given to
 * #wrapApiHandler(handler). It will automatically transform the result.
 *
 * @param result object to serialize into JSON as the response body
 * @returns {APIGatewayProxyResult}
 */
export declare function apiSuccess(result?: any): APIGatewayProxyResult;
/**
 * Construct the object that API Gateway payload format v1 wants back upon a failed run.
 *
 * Often, it is simpler to throw a http-errors exception from your #wrapApiHandler
 * handler.
 *
 * @see https://www.npmjs.com/package/http-errors
 * @param statusCode HTTP status code, between 400 and 599.
 * @param message string to return in the response body
 * @returns {APIGatewayProxyResult}
 */
export declare function apiFailure(statusCode: number, message?: string): APIGatewayProxyResult;
