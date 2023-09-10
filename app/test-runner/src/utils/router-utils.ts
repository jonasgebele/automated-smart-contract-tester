import type { Request, Response } from 'express';

import HTTPError from '@errors/http-error';

import errorUtils from './error-utils';

/**
 * Parses a JSON string from the request body and returns it as an object.
 *
 * @param {Request} req - The Express.js request object.
 * @param {string} objectKey - The key of the JSON object in the request body.
 * @param {boolean} [required=false] - Indicates whether the object is required in the request body.
 * @returns {object | undefined} The parsed JSON object.
 * @throws {HTTPError} If the JSON parsing fails or if the object is not found in the request body.
 */
const parseJsonObjectFromBody = (req: Request, objectKey: string, required: boolean = false): object | undefined => {
  try {
    const jsonString = req.body[objectKey];
    if (!jsonString && required) throw new HTTPError(400, `Object (${objectKey}) not found in the request body.`);

    return jsonString && JSON.parse(jsonString);
  } catch (err: Error | unknown) {
    throw errorUtils.logAndGetError(new HTTPError(
      (err as HTTPError)?.statusCode || 400,
      `Failed to parse JSON object (${objectKey}) from the request body.`,
      (err as HTTPError)?.reason || (err as Error)?.message)
    );
  }
};

/**
 * Extracts file buffer from the request object.
 *
 * @param {Request} req - The Express.js request object.
 * @returns {Buffer} The extracted file buffer.
 * @throws {HTTPError} If there's an error while extracting the file buffer.
 */
const extractFileBuffer = (req: Request): Buffer => {
  try {
    return req.file!.buffer;
  } catch (err: Error | unknown) {
    const message = 'An error occurred while reading the file buffer.';
    throw errorUtils.logAndGetError(new HTTPError(400, message, (err as Error)?.message));
  }
};

/**
 * Handles errors by sending an appropriate HTTP response to the client.
 *
 * If the error is an instance of HTTPError, it sets the response status code to the error's status code
 * and sends a JSON response containing the error details.
 *
 * If the error is not an instance of HTTPError, it sets the response status code to 500 (Internal Server Error)
 * and sends a JSON response containing the error message from the Error object, if available.
 *
 * @param {Response} res - The Express.js response object to send the error response.
 * @param {HTTPError | Error | unknown} err - The error object to handle.
 * @returns void
 */
const handleError = (res: Response, err: HTTPError | Error | unknown): void => {
  const httpErr = (err instanceof HTTPError) ? err : new HTTPError(500, (err as Error)?.message);
  res.status(httpErr.statusCode).json({ error: httpErr });
};

export default { parseJsonObjectFromBody, extractFileBuffer, handleError };
