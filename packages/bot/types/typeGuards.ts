/**
 * @param error the error object.
 * @returns if given error object is a NodeJS error.
 */
export const isNodeError = (error: unknown): error is NodeJS.ErrnoException =>
    error instanceof Error;
