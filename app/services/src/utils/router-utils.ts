import type { Request, Response } from 'express';
import { HttpStatusCode } from 'axios';

import AppError from '@errors/app-error';

import errorUtils from './error-utils';

export interface RequestFile extends Express.Multer.File {}

/**
 * Parses a JSON string from the request body and returns it as an object.
 *
 * @param {Request} req - The Express.js request object.
 * @param {string} objectKey - The key of the JSON object in the request body.
 * @param {boolean} [required=false] - Indicates whether the object is required in the request body.
 * @returns {object | undefined} The parsed JSON object.
 * @throws {AppError} If the JSON parsing fails or if the object is not found in the request body.
 */
const parseJsonObjectFromBody = (req: Request, objectKey: string, required: boolean = false): object | undefined => {
  const jsonString = req.body[objectKey];
  if (!jsonString && required) {
    throw errorUtils.handleError(new AppError(HttpStatusCode.BadRequest, `Object (${objectKey}) not found in the request body.`));
  }

  try {
    return jsonString && JSON.parse(jsonString);
  } catch (err: Error | unknown) {
    throw errorUtils.handleError(new AppError(HttpStatusCode.BadRequest, `Failed to parse JSON object (${objectKey}) from the request body.`));
  }
};

/**
 * Get the file attached to a request.
 *
 * @param {Request} req - The HTTP request object.
 * @returns {RequestFile} The file attached to the request.
 * @throws {AppError} If the request does not contain a file or an error occurs while reading the file buffer.
 */
const getRequestFile = (req: Request): RequestFile => {
  try {
    if (!req.file!.buffer) throw new Error('Cannot read the buffer.');
    return req.file!;
  } catch (err: Error | unknown) {
    throw errorUtils.handleError(err, 'An error occurred while reading the file buffer.', HttpStatusCode.BadRequest);
  }
};

/**
 * Handles errors by sending an appropriate HTTP response to the client.
 *
 * If the error is an instance of AppError, it sets the response status code to the error's status code
 * and sends a JSON response containing the error details.
 *
 * If the error is not an instance of AppError, it sets the response status code to 500 (Internal Server Error)
 * and sends a JSON response containing the error message from the Error object, if available.
 *
 * @param {Response} res - The Express.js response object to send the error response.
 * @param {AppError | Error | unknown} err - The error object to handle.
 * @returns void
 */
const sendErrorResponse = (res: Response, err: AppError | Error | unknown): void => {
  const httpErr = (err instanceof AppError)
    ? err
    : new AppError(HttpStatusCode.InternalServerError, (err as Error)?.message);

  res.status(httpErr.statusCode).json({ error: httpErr });
};

export default { parseJsonObjectFromBody, getRequestFile, sendErrorResponse };
