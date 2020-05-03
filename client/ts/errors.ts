/**
 * Error to indicate an invalid action performed due to invalid state of connection
 */
export class InvalidActionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, InvalidActionError.prototype);
    }
}
