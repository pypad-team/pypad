/** Custom error to indicate an invalid connection operation */
export class ConnectionError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, ConnectionError.prototype);
    }
}

/** Custom error to indicate an invalid text operation */
export class TextError extends Error {
    constructor(message: string) {
        super(message);
        Object.setPrototypeOf(this, TextError.prototype);
    }
}
